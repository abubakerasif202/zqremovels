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
    if (u.includes("sts.googleapis.com")) return result({access_token:"federated-token"});
    if (u.includes("iamcredentials.googleapis.com")) return result({token:"google-cloudrun-id-token"});
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
  assert.ok(seen.some(v=>v.url.includes("sts.googleapis.com")));
  assert.ok(seen.some(v=>v.url.includes("iamcredentials.googleapis.com")));
  assert.ok(seen.some(v=>v.method==="DELETE" && v.url.includes("/sessions/")));
  assert.equal(seen.filter(v=>v.url.endsWith("/run")).length,1);
});
