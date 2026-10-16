"use strict";
const { createHash, timingSafeEqual } = require("node:crypto");
const { requestWeb3Forms } = require("../lib/server/web3forms.js");
const MAX_BODY_BYTES = 16384;
const MAX_REQUESTS_PER_MINUTE = 30;
const REDIS_TIMEOUT_MS = 5000;
const REQUEST_FIELDS = ["submission_id", "consent", "dry_run", "lead"];
const RATE_LIMIT_KEY = "zq:ai-lead:rate:v1";
const RATE_LIMIT_SCRIPT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],60) end; return n";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELD_MAX_LENGTHS = {
  full_name: 120,
  phone: 30,
  email: 254,
  pickup_suburb: 120,
  dropoff_suburb: 120,
  crew_package: 120,
  move_scope: 120,
  property_type: 120,
  move_size: 120,
  pickup_access: 500,
  dropoff_access: 500,
  packing_required: 120,
  move_details: 4000,
  move_date: 10
};
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
function validatePayload(value) {
  if (!isRecord(value) || Object.keys(value).some(key => !REQUEST_FIELDS.includes(key))) {
    throw new Error("Invalid request fields.");
  }
  if (typeof value.submission_id !== "string" || !UUID.test(value.submission_id)) {
    throw new Error("A valid submission_id UUID is required.");
  }
  if (value.consent !== true || typeof value.dry_run !== "boolean") {
    throw new Error("Explicit consent and a boolean dry_run are required.");
  }
  if (!isRecord(value.lead) || Object.keys(value.lead).some(key => !Object.hasOwn(FIELD_MAX_LENGTHS, key))) {
    throw new Error("Invalid lead fields.");
  }
  const lead = {};
  for (const [key, max] of Object.entries(FIELD_MAX_LENGTHS)) {
    if (key === "move_date" && value.lead[key] === undefined) {
      continue;
    }
    const field = value.lead[key];
    if (typeof field !== "string" || !field.trim() || field.length > max || /[\x00-\x1f\x7f]/.test(field)) {
      throw new Error(`Invalid field: ${key}.`);
    }
    lead[key] = field.trim();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    throw new Error("Invalid email.");
  }
  if (!/^\+?[0-9 ()-]+$/.test(lead.phone) || lead.phone.replace(/\D/g, "").length < 8 || lead.phone.replace(/\D/g, "").length > 15) {
    throw new Error("Invalid phone.");
  }
  if (lead.move_date && (!/^\d{4}-\d{2}-\d{2}$/.test(lead.move_date) || !Number.isFinite(Date.parse(lead.move_date)) || new Date(lead.move_date).toISOString().slice(0, 10) !== lead.move_date)) {
    throw new Error("Invalid move_date.");
  }
  if (value.dry_run && (!/^Test /.test(lead.full_name) || !/^[^@]+@example\.com$/i.test(lead.email) || lead.phone !== "0400000000" || lead.pickup_suburb !== "Test Pickup" || lead.dropoff_suburb !== "Test Dropoff" || !lead.move_details.startsWith("FICTIONAL TEST DATA"))) {
    throw new Error("Dry runs require the documented fictional test fixture.");
  }
  return {
    submission_id: value.submission_id.toLowerCase(), consent: true, dry_run: value.dry_run, lead
  };
}
function createHandler({ env = process.env, fetch: fetchImpl = globalThis.fetch, deliver } = {}) {
  const delivery = deliver || (async (payload, key) => {
    const response = await requestWeb3Forms(payload, key, fetchImpl);
    return { response, result: await response.json() };
  });
  return async function handler(req, res) {
    let id = null;
    const reply = (code, status, message, success = false) => {
      res.status(code);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify({
        success, submission_id: id, status, message
      }));
    };
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return reply(405, "method_not_allowed", "Use POST.");
    }
    if (Object.keys(req.headers || {}).some(key => key.toLowerCase() === "origin")) {
      return reply(403, "forbidden", "Server-to-server requests only.");
    }
    const secret = env.ZQ_AI_LEAD_SECRET;
    if (typeof secret !== "string" || Buffer.byteLength(secret) < 32) {
      return reply(503, "configuration_error", "AI lead submission is unavailable.");
    }
    const auth = req.headers?.authorization;
    const supplied = typeof auth === "string" && auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const digest = text => createHash("sha256").update(text).digest();
    if (!timingSafeEqual(digest(secret), digest(supplied))) {
      return reply(401, "unauthorized", "Authentication required.");
    }
    if (!/^application\/json\b/i.test(req.headers?.["content-type"] || "")) {
      return reply(400, "invalid_request", "JSON content type required.");
    }
    let data;
    try {
      let body = req.body;
      if (body === undefined) {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk);
          if (size > MAX_BODY_BYTES) {
            throw new Error("Request is too large.");
          }
          chunks.push(Buffer.from(chunk));
        }
        body = Buffer.concat(chunks).toString("utf8");
      }
      if (Buffer.isBuffer(body)) {
        body = body.toString("utf8");
      }
      if (Buffer.byteLength(typeof body === "string" ? body : JSON.stringify(body)) > MAX_BODY_BYTES) {
        throw new Error("Request is too large.");
      }
      const parsed = typeof body === "string" ? JSON.parse(body) : body;
      if (typeof parsed?.submission_id === "string" && UUID.test(parsed.submission_id)) {
        id = parsed.submission_id.toLowerCase();
      }
      data = validatePayload(parsed);
    } catch (error) {
      return reply(400, "invalid_request", error instanceof SyntaxError ? "Invalid JSON." : error.message);
    }
    if (data.dry_run) {
      return reply(200, "dry_run", "Validation succeeded. No enquiry was submitted.", true);
    }
    if (env.ZQ_AI_LEAD_ENABLED !== "true") {
      return reply(503, "disabled", "Live AI lead submission is disabled.");
    }
    let redisUrl;
    try {
      redisUrl = new URL(env.KV_REST_API_URL);
      if (redisUrl.protocol !== "https:" || redisUrl.username || redisUrl.password || !env.KV_REST_API_TOKEN || !env.WEB3FORMS_ACCESS_KEY?.trim()) {
        throw new Error();
      }
    } catch {
      return reply(503, "configuration_error", "AI lead submission is unavailable.");
    }
    async function redis(command) {
      const response = await fetchImpl(redisUrl.href, {
        method: "POST", headers: { Authorization: `Bearer ${env.KV_REST_API_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(command), signal: AbortSignal.timeout(REDIS_TIMEOUT_MS), redirect: "error"
      });
      if (!response.ok) {
        throw new Error("Datastore unavailable");
      }
      const result = await response.json();
      if (!isRecord(result) || result.error || !Object.hasOwn(result, "result")) {
        throw new Error("Datastore unavailable");
      }
      return result.result;
    }
    const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    const key = `zq:ai-lead:v1:${id}`;
    const replay = raw => {
      const record = JSON.parse(raw);
      if (record.hash !== hash) {
        return reply(409, "conflict", "This submission_id is already associated with different details.");
      }
      if (record.status === "accepted") {
        return reply(200, "accepted", "Your enquiry was accepted by the delivery service. This is not a booking confirmation.", true);
      }
      if (record.status === "pending") {
        return reply(202, "pending", "Submission is pending. Do not create another submission.");
      }
      return reply(502, record.status === "rejected" ? "rejected" : "unknown", "Delivery was not confirmed. Contact the team before attempting another submission.");
    };
    try {
      const existing = await redis(["GET", key]);
      if (existing !== null) {
        return replay(existing);
      }
      const count = await redis(["EVAL", RATE_LIMIT_SCRIPT, "1", RATE_LIMIT_KEY]);
      if (!Number.isInteger(count) || count < 1) {
        throw new Error();
      }
      if (count > MAX_REQUESTS_PER_MINUTE) {
        return reply(429, "rate_limited", "Submission limit reached. Try later with the same submission_id.");
      }
      const reserved = await redis(["SET", key, JSON.stringify({ hash, status: "pending" }), "NX"]);
      if (reserved !== "OK") {
        const existing = await redis(["GET", key]);
        if (existing === null) {
          throw new Error();
        }
        return replay(existing);
      }
    } catch {
      return reply(503, "datastore_unavailable", "Submission state is unavailable. Retry only with the same submission_id.");
    }
    let status = "unknown";
    try {
      const { response, result } = await delivery({
        ...data.lead,
        subject: "Quote request - ZQ Removals (AI receptionist)",
        from_name: data.lead.full_name,
        botcheck: "",
        submission_id: id,
        source: "ai_receptionist",
        consent: "Explicitly approved"
      }, env.WEB3FORMS_ACCESS_KEY);
      if (response.ok && result?.success === true) {
        status = "accepted";
      } else if (response.status >= 400 && response.status < 500 && result?.success === false) {
        status = "rejected";
      }
    } catch {
      // Retain an unknown terminal result after uncertain provider delivery.
    }
    try {
      const result = await redis(["SET", key, JSON.stringify({ hash, status }), "XX"]);
      if (result !== "OK") {
        throw new Error();
      }
    } catch {
      return reply(502, "unknown", "Delivery state could not be recorded. Do not resubmit with another identifier.");
    }
    if (status === "accepted") {
      return reply(200, "accepted", "Your enquiry was accepted by the delivery service. This is not a booking confirmation.", true);
    }
    return reply(502, status, "Delivery was not confirmed. Contact the team before attempting another submission.");
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
module.exports.validatePayload = validatePayload;
