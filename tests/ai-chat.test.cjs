"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createHandler, extractAnswer, briefContext } = require("../api/ai-chat");

function responseMock() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    setHeader(k,v) { headers[k.toLowerCase()] = v; },
    end(text) { this.body = JSON.parse(text); }
  };
}
const enabled = { ZQ_CHAT_ENABLED: "true", KV_REST_API_URL: "https://redis.example.com", KV_REST_API_TOKEN: "test-server-token" };
test("fails closed until explicitly enabled", async () => {
  const res = responseMock();
  await createHandler({ env: {} })({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 503);
});
test("cross-site messages are denied before provider calls", async () => {
  const res = responseMock();
  await createHandler({ env: enabled })({ method: "POST", headers: { origin:"https://evil.invalid" }, body: {message:"hello"} }, res);
  assert.equal(res.statusCode, 403);
});
test("invalid text is denied", async () => {
  const res = responseMock();
  await createHandler({ env: enabled })({ method: "POST", headers: { origin:"https://zqremovalsadelaide.com.au" }, body: {message:""} }, res);
  assert.equal(res.statusCode, 400);
});
test("extractAnswer rejects submissions and native confirmation in website chat", () => {
  assert.throws(() => extractAnswer([{author:"zq_receptionist",content:{role:"model",parts:[{functionCall:{name:"submit_lead"}}]}}]));
  assert.throws(() => extractAnswer([{actions:{requestedToolConfirmations:{a:true}}}]));
  assert.equal(extractAnswer([{author:"zq_receptionist",content:{role:"model",parts:[{text:"Good morning"}]}}]),"Good morning");
});
test("recent conversation is passed as context, without extra privileges", () => {
  const v=briefContext([{role:"user",text:"Pickup Adelaide"},{role:"assistant",text:"Where to?"}],"Glenelg");
  assert.match(v,/Pickup Adelaide/);
  assert.match(v,/Glenelg/);
  assert.match(v,/Do not call submit_lead/);
});
test("full authenticated quote conversation persists only bounded Redis turns", async () => {
  const seen = [];
  const values = new Map();
  const fetcher = async (url, opts) => {
    const u = String(url);
    seen.push({url:u, method:opts.method, body:opts.body});
    const result = (obj, code=200) => new Response(JSON.stringify(obj), {status:code});
    if (u === "https://redis.example.com") {
      const [command,...args] = JSON.parse(opts.body);
      if(command==="EVAL") return result({result:1});
      if(command==="GET") return result({result:values.get(args[0]) ?? null});
      if(command==="SET") { if(args.includes("NX") && values.has(args[0])) return result({result:null}); values.set(args[0],args[1]); return result({result:"OK"}); }
      if(command==="DEL") { values.delete(args[0]); return result({result:1}); }
    }
    if (new URL(u).hostname === "sts.googleapis.com") return result({access_token:"federated-token"});
    if (new URL(u).hostname === "iamcredentials.googleapis.com") return result({token:"google-cloudrun-id-token"});
    if (u.endsWith("/run")) return result([{author:"zq_receptionist",content:{role:"model",parts:[{text:"Two movers are A$75 per 30 minutes. Final price depends on duration."}]}}]);
    if (u.includes("/sessions/") && opts.method==="POST") return result({id:"s123"});
    if (u.includes("/sessions/") && opts.method==="DELETE") return new Response(null, {status:204});
    throw Error("Unexpected network: "+u);
  };
  const res = responseMock();
  await createHandler({env:enabled,fetcher})({
    method:"POST",
    headers:{
      origin:"https://zqremovalsadelaide.com.au",
      "x-vercel-oidc-token":"signed-production-token",
      "x-forwarded-for":"203.0.113.9",
    },
    body:{message:"How much for two movers?"}
  },res);
  assert.equal(res.statusCode,200);
  assert.match(res.body.reply,/A\$75/);
  assert.equal(res.body.turns.length,2);
  assert.match(res.headers["set-cookie"],/HttpOnly; SameSite=Lax/);
  assert.ok(seen.some(v=>new URL(v.url).hostname === "sts.googleapis.com"));
  assert.ok(seen.some(v=>new URL(v.url).hostname === "iamcredentials.googleapis.com"));
  assert.ok(seen.some(v=>v.method==="DELETE" && v.url.includes("/sessions/")));
  assert.equal(seen.filter(v=>v.url.endsWith("/run")).length,1);
});

function chatHarness(agentText, rateCount = () => 1) {
  const values = new Map();
  const runs = [];
  const result = (obj, code = 200) => new Response(JSON.stringify(obj), { status: code });
  const fetcher = async (url, opts) => {
    const u = String(url);
    if (u === "https://redis.example.com") {
      const [command, ...args] = JSON.parse(opts.body);
      if (command === "EVAL") {
        // The lock-release script deletes the lock key when it is still owned; rate-limit scripts return a count.
        if (/redis\.call\('DEL'/.test(args[0])) { if (values.get(args[2]) === args[3]) values.delete(args[2]); return result({ result: 1 }); }
        return result({ result: rateCount(args[2]) });
      }
      if (command === "GET") return result({ result: values.get(args[0]) ?? null });
      if (command === "SET") { if (args.includes("NX") && values.has(args[0])) return result({ result: null }); values.set(args[0], args[1]); return result({ result: "OK" }); }
      if (command === "DEL") { values.delete(args[0]); return result({ result: 1 }); }
    }
    if (new URL(u).hostname === "sts.googleapis.com") return result({ access_token: "federated-token" });
    if (new URL(u).hostname === "iamcredentials.googleapis.com") return result({ token: "google-cloudrun-id-token" });
    if (u.endsWith("/run")) {
      runs.push(JSON.parse(opts.body).newMessage.parts[0].text);
      return result([{ author: "zq_receptionist", content: { role: "model", parts: [{ text: typeof agentText === "function" ? agentText(runs.length) : agentText }] } }]);
    }
    if (u.includes("/sessions/") && opts.method === "POST") return result({ id: "s123" });
    if (u.includes("/sessions/") && opts.method === "DELETE") return new Response(null, { status: 204 });
    throw Error("Unexpected network: " + u);
  };
  let cookie = "";
  const call = async (body) => {
    const res = responseMock();
    await createHandler({ env: enabled, fetcher })({
      method: "POST",
      headers: { origin: "https://zqremovalsadelaide.com.au", "x-vercel-oidc-token": "signed-production-token", "x-forwarded-for": "203.0.113.9", cookie },
      body
    }, res);
    if (res.headers["set-cookie"]) cookie = res.headers["set-cookie"].split(";")[0];
    return res;
  };
  return { call, runs, values };
}

test("a ready cue is hidden from the customer, stored without the marker and reported as enquiry_ready", async () => {
  const h = chatHarness("Thanks Sam. Press 'Review & send my enquiry' to check everything.\n[[ENQUIRY_READY]]");
  const res = await h.call({ message: "I'm Sam on 0412 345 678 moving Glenelg to Unley" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.enquiry_ready, true);
  assert.doesNotMatch(res.body.reply, /ENQUIRY_READY/);
  assert.doesNotMatch(JSON.stringify(res.body.turns), /ENQUIRY_READY/);
  assert.match(h.runs[0], /Do not call submit_lead/);
  assert.match(h.runs[0], /A\$75 per 30 minutes/);
  assert.match(h.runs[0], /A\$89 per 30 minutes/);
});

test("ordinary replies are not marked enquiry_ready", async () => {
  const h = chatHarness("Two movers are A$75 per 30 minutes.");
  const res = await h.call({ message: "price?" });
  assert.equal(res.body.enquiry_ready, false);
});

test("draft extraction is refused until the customer has said something", async () => {
  const h = chatHarness("{}");
  const res = await h.call({ action: "draft" });
  assert.equal(res.statusCode, 400);
  assert.equal(h.runs.length, 0);
});

test("draft extraction returns only validated, whitelisted values for the customer to review", async () => {
  const dirty = JSON.stringify({
    full_name: "  Sam Citizen ", phone: "0412 345 678", email: "not-an-email",
    pickup_suburb: "Glenelg", dropoff_suburb: "Unley", move_date: "2020-01-01",
    crew_package: "2 MEN + TRUCK", move_scope: "Teleport", property_type: "House",
    move_size: "3 bedrooms", pickup_access: "Two flights of stairs\u0000", dropoff_access: "",
    packing_required: "maybe", move_details: "Piano", is_admin: true, consent: true
  });
  const h = chatHarness(count => count === 1 ? "Happy to help." : "Here you go:\n```json\n" + dirty + "\n```");
  await h.call({ message: "hello, moving Glenelg to Unley" });
  const res = await h.call({ action: "draft" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(Object.keys(res.body), ["lead"]);
  const lead = res.body.lead;
  assert.equal(lead.full_name, "Sam Citizen");
  assert.equal(lead.phone, "0412 345 678");
  assert.equal(lead.email, "");
  assert.equal(lead.move_date, "");
  assert.equal(lead.crew_package, "2 men + truck");
  assert.equal(lead.move_scope, "");
  assert.equal(lead.packing_required, "");
  assert.equal(lead.pickup_access, "Two flights of stairs");
  assert.equal(Object.hasOwn(lead, "is_admin"), false);
  assert.equal(Object.hasOwn(lead, "consent"), false);
  assert.match(h.runs[1], /EXTRACTION TASK/);
});

test("draft extraction fails cleanly when the model does not return JSON", async () => {
  const h = chatHarness(count => count === 1 ? "Hi" : "Sorry, I can't do that.");
  await h.call({ message: "hello" });
  const res = await h.call({ action: "draft" });
  assert.equal(res.statusCode, 502);
  assert.equal(res.body.lead, undefined);
});

test("draft requests cannot carry extra fields or reach the agent from another origin", async () => {
  const h = chatHarness("{}");
  const extra = await h.call({ action: "draft", message: "also this" });
  assert.equal(extra.statusCode, 400);
  const res = responseMock();
  await createHandler({ env: enabled, fetcher: h.call })({ method: "POST", headers: { origin: "https://evil.invalid" }, body: { action: "draft" } }, res);
  assert.equal(res.statusCode, 403);
});

test("sanitizeDraft accepts a future date and rejects impossible ones", () => {
  const { sanitizeDraft } = require("../api/ai-chat");
  const now = new Date("2027-03-01T00:00:00Z");
  assert.equal(sanitizeDraft({ move_date: "2027-03-20" }, now).move_date, "2027-03-20");
  assert.equal(sanitizeDraft({ move_date: "2027-02-30" }, now).move_date, "");
  assert.equal(sanitizeDraft({ move_date: "2027-02-01" }, now).move_date, "");
  assert.equal(sanitizeDraft(null, now).full_name, "");
});

test("draft extraction forbids tool calls and has a tighter per-session limit than chat", async () => {
  // 5 requests in the window: over the draft limit (4) but within the chat limit (12).
  const h = chatHarness(count => count === 1 ? "Hi" : "{}", key => (String(key).includes(":draft:") || String(key).includes(":rate:") ? 5 : 1));
  const chat = await h.call({ message: "hello" });
  assert.equal(chat.statusCode, 200);
  const draft = await h.call({ action: "draft" });
  assert.equal(draft.statusCode, 429);
  assert.equal(h.runs.length, 1);
  const ok = chatHarness(count => count === 1 ? "Hi" : "{}");
  await ok.call({ message: "hello" });
  const allowed = await ok.call({ action: "draft" });
  assert.equal(allowed.statusCode, 200);
  assert.match(ok.runs[1], /Do not call any tools/);
});

test("sanitizeDraft drops over-length values instead of truncating them", () => {
  const { sanitizeDraft } = require("../api/ai-chat");
  const long = "a".repeat(250) + "@example.com";
  assert.equal(sanitizeDraft({ email: long }).email, "");
  assert.equal(sanitizeDraft({ phone: "0412 " + " ".repeat(40) + "345 678" }).phone, "");
  assert.equal(sanitizeDraft({ full_name: "x".repeat(121) }).full_name, "");
  assert.equal(sanitizeDraft({ full_name: "x".repeat(120) }).full_name, "x".repeat(120));
});
