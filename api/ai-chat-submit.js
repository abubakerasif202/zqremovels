"use strict";
// Explicit customer-confirmed enquiry submission from the ZQ website chat.
// The customer-entered form, not model-generated text, is the source of truth.
// This endpoint never accepts conversational "yes" as consent.
const { createHash } = require("node:crypto");
const { validatePayload } = require("./ai-lead.js");

const VALID_ORIGINS = new Set([
  "https://zqremovalsadelaide.com.au",
  "https://www.zqremovalsadelaide.com.au",
]);
const API_URL = "https://zqremovalsadelaide.com.au/api/ai-lead/";
const STORE_PREFIX = "zq:website-ai:v1:";
const ONE_DAY = 86400;
const RECORD_TTL = 7 * ONE_DAY;
const LIMIT_PER_IP_DAY = 3;
const MAX_BODY_BYTES = 12000;

function respond(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(data));
}
function cookieSession(req) {
  const cookie = String(req.headers?.cookie || "").split(";")
    .map(t => t.trim()).find(t => t.startsWith("zq_chat_sid="));
  const sid = cookie?.slice("zq_chat_sid=".length);
  return typeof sid === "string" && /^[a-f0-9]{48}$/.test(sid) ? sid : null;
}
async function responseJson(response) {
  const text = await response.text();
  if (text.length > 16000) throw new Error("Upstream response too large");
  return JSON.parse(text);
}
function createHandler({env=process.env, fetcher=globalThis.fetch}={}) {
  const redis = async (...args) => {
    const target = new URL(env.KV_REST_API_URL || "");
    if (target.protocol !== "https:" || target.username || target.password ||
        !env.KV_REST_API_TOKEN) throw new Error("Invalid datastore setup");
    const r = await fetcher(target.href, {
      method:"POST", redirect:"error",
      headers:{Authorization:"Bearer " + env.KV_REST_API_TOKEN,"Content-Type":"application/json"},
      body:JSON.stringify(args), signal:AbortSignal.timeout(6500)
    });
    if (!r.ok) throw new Error("Datastore unavailable");
    const result = await responseJson(r);
    if (!result || !Object.hasOwn(result,"result") || result.error) throw new Error("Datastore unavailable");
    return result.result;
  };
  return async (req,res) => {
    if(req.method !== "POST") {
      res.setHeader("Allow","POST");
      return respond(res,405,{status:"method_not_allowed",message:"Use POST."});
    }
    if(env.ZQ_CHAT_ENABLED !== "true" || env.ZQ_CHAT_LEADS_ENABLED !== "true" ||
      env.ZQ_AI_LEAD_ENABLED !== "true") {
      return respond(res,503,{status:"disabled",message:"AI enquiry submissions are currently unavailable."});
    }
    if(!VALID_ORIGINS.has(req.headers?.origin) ||
      !/^application\/json\b/i.test(req.headers?.["content-type"] || "")) {
      return respond(res,403,{status:"forbidden",message:"Invalid request origin or content type."});
    }
    const sid = cookieSession(req);
    if(!sid) return respond(res,403,{status:"session_required",message:"Open ZQ AI chat before submitting your enquiry."});
    if(typeof env.ZQ_AI_LEAD_SECRET !== "string" || env.ZQ_AI_LEAD_SECRET.length < 32) {
      return respond(res,503,{status:"configuration_error",message:"Submission credentials unavailable."});
    }
    let lead;
    let submissionId;
    try {
      let body = req.body;
      if (Buffer.isBuffer(body)) body = body.toString("utf8");
      if(typeof body === "string" && Buffer.byteLength(body) > MAX_BODY_BYTES) throw new Error("Request too large");
      if(typeof body === "string") body = JSON.parse(body);
      if(!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some(key => !["submission_id","consent","lead","botcheck"].includes(key)) ||
        (body.botcheck !== undefined && body.botcheck !== "") ||
        Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) throw new Error("Invalid request");
      // Reuse the protected AI lead contract; there is no browser-facing dry_run switch.
      const clean = validatePayload({submission_id:body.submission_id,consent:body.consent,dry_run:false,lead:body.lead});
      lead = clean.lead;
      submissionId = clean.submission_id;
    } catch {
      return respond(res,400,{status:"invalid_request",message:"Please review all required moving details, your email and phone, then approve sending."});
    }
    const sessionKey = STORE_PREFIX + "session:" + sid;
    const receiptKey = STORE_PREFIX + "lead:" + sid;
    const payloadHash = createHash("sha256").update(JSON.stringify(lead)).digest("hex");
    const replay = (record) => {
      if(record.hash !== payloadHash) {
        return respond(res,409,{status:"conflict",message:"An enquiry has already been attempted in this conversation. Please contact our team before starting another."});
      }
      if(record.status === "accepted") {
        return respond(res,200,{status:"accepted",success:true,replayed:true,submission_id:record.submission_id,
          message:"Your enquiry was already accepted by the delivery service. This is not a confirmed booking."});
      }
      if(record.status === "pending") {
        return respond(res,202,{status:"pending",submission_id:record.submission_id,
          message:"Submission is still pending. Please do not send it again."});
      }
      return respond(res,502,{status:"unknown",submission_id:record.submission_id,
        message:"We could not confirm delivery. Please call 0433 819 989 before trying again."});
    };
    try {
      // Require a server-created chat session, rather than accepting invented cookies.
      if(!await redis("GET",sessionKey)) {
        return respond(res,403,{status:"session_required",message:"Reopen the AI chat and try again."});
      }
      const prior = await redis("GET",receiptKey);
      if(prior !== null) return replay(JSON.parse(prior));
      const ip = String(req.headers["x-vercel-forwarded-for"] ||
        req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
      const digest = createHash("sha256").update(ip + "|zq-enquiry-v1").digest("hex").slice(0,32);
      const limit = await redis("EVAL",
        "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],86400) end; return n",
        "1",STORE_PREFIX+"submit-ip:"+digest);
      if(!Number.isInteger(limit) || limit > LIMIT_PER_IP_DAY) {
        return respond(res,429,{status:"rate_limited",message:"Too many enquiries from this connection. Please call 0433 819 989."});
      }
      const reserved = await redis("SET",receiptKey,JSON.stringify({
        hash:payloadHash,submission_id:submissionId,status:"pending"
      }),"EX",String(RECORD_TTL),"NX");
      if(reserved !== "OK") {
        const pending = await redis("GET",receiptKey);
        if(!pending) throw new Error("Reservation not confirmed");
        return replay(JSON.parse(pending));
      }
    } catch {
      return respond(res,503,{status:"datastore_unavailable",
        message:"We couldn't verify submission status. Please contact ZQ Removals before trying again."});
    }
    // The reservation is durable before the provider call. Any uncertain result
    // is terminal until a staff member checks it. This prevents duplicate sends.
    let status = "unknown";
    try {
      const response = await fetcher(API_URL, {
        method:"POST",redirect:"error",
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+env.ZQ_AI_LEAD_SECRET},
        body:JSON.stringify({submission_id:submissionId,consent:true,dry_run:false,lead}),
        signal:AbortSignal.timeout(22000),
      });
      const result = await responseJson(response);
      if(response.status === 200 && result.status === "accepted" && result.success === true) {
        status = "accepted";
      } else if(response.status === 202 && result.status === "pending") {
        status = "pending";
      }
    } catch {
      // Never infer whether the real provider accepted a timed-out request.
    }
    try {
      const stored = await redis("SET",receiptKey,JSON.stringify({
        hash:payloadHash,submission_id:submissionId,status
      }),"XX","KEEPTTL");
      if(stored !== "OK") throw new Error("Could not record receipt");
    } catch { status = "unknown"; }
    if(status === "accepted") {
      return respond(res,200,{status:"accepted",success:true,submission_id:submissionId,
        message:"Your enquiry was accepted by our delivery service. ZQ Removals will review it. This is not a confirmed booking."});
    }
    if(status === "pending") {
      return respond(res,202,{status:"pending",submission_id:submissionId,
        message:"Your enquiry is pending. Please don't send it again."});
    }
    return respond(res,502,{status:"unknown",submission_id:submissionId,
      message:"Delivery could not be confirmed. Please call 0433 819 989 before trying again."});
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
