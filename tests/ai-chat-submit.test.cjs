"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createHandler } = require("../api/ai-chat-submit.js");
const crypto = require("node:crypto");

const SID = "a".repeat(48);
const ID = "fa36b2d8-6a4e-47c4-a2b5-aee32e537f01";
const env = {
  ZQ_CHAT_ENABLED:"true",
  ZQ_CHAT_LEADS_ENABLED:"true",
  ZQ_AI_LEAD_ENABLED:"true",
  ZQ_AI_LEAD_SECRET:"some-test-secret-" + "s".repeat(40),
  KV_REST_API_URL:"https://redis.example.test",
  KV_REST_API_TOKEN:"server-token",
};
function validLead() {
  return {
    full_name:"Test Customer",
    phone:"0400000000",
    email:"fictional@example.com",
    pickup_suburb:"Test Pickup",
    dropoff_suburb:"Test Dropoff",
    crew_package:"2 men + truck",
    move_scope:"Local move",
    property_type:"House",
    move_size:"1 bedroom",
    pickup_access:"Ground floor",
    dropoff_access:"Ground floor",
    packing_required:"No",
    move_details:"FICTIONAL TEST DATA. Do not contact or book."
  };
}
function request(body={},headers={}) {
  return {
    method:"POST",
    headers:{
      origin:"https://zqremovalsadelaide.com.au",
      "content-type":"application/json",
      cookie:"zq_chat_sid="+SID,
      "x-vercel-forwarded-for":"203.0.113.15",
      ...headers
    },
    body:{submission_id:ID,consent:true,lead:validLead(),botcheck:"",...body},
  };
}
function response() {
  return {
    statusCode:200,
    headers:{},
    setHeader(k,v){this.headers[k.toLowerCase()] = v;},
    end(text){this.data=JSON.parse(text);}
  };
}
function fakeServices(providerStatus="accepted") {
  const storage=new Map();
  const calls=[];
  storage.set("zq:website-ai:v1:session:"+SID,JSON.stringify({turns:[]}));
  const fetcher=async (url, options) => {
    const target=new URL(url);
    calls.push({hostname:target.hostname,pathname:target.pathname,headers:options.headers,body:options.body});
    if(target.hostname==="redis.example.test") {
      const [cmd,...args]=JSON.parse(options.body);
      if(cmd==="GET") return new Response(JSON.stringify({result:storage.get(args[0])??null}),{status:200});
      if(cmd==="SET") {
        if(args.includes("NX") && storage.has(args[0])) return new Response(JSON.stringify({result:null}),{status:200});
        if(args.includes("XX") && !storage.has(args[0])) return new Response(JSON.stringify({result:null}),{status:200});
        storage.set(args[0],args[1]);
        return new Response(JSON.stringify({result:"OK"}),{status:200});
      }
      if(cmd==="EVAL") return new Response(JSON.stringify({result:1}),{status:200});
      throw new Error("Unexpected Redis command "+cmd);
    }
    if(target.hostname==="zqremovalsadelaide.com.au" && target.pathname==="/api/ai-lead/") {
      const payload=JSON.parse(options.body);
      assert.equal(payload.dry_run,false);
      assert.equal(payload.consent,true);
      assert.equal(options.headers.Authorization,"Bearer "+env.ZQ_AI_LEAD_SECRET);
      if(providerStatus==="timeout") throw new Error("provider connection uncertain");
      if(providerStatus==="pending") return new Response(JSON.stringify({success:false,status:"pending"}),{status:202});
      return new Response(JSON.stringify({success:true,status:"accepted"}),{status:200});
    }
    throw new Error("Unrecognised outgoing host");
  };
  return {calls,fetcher,storage};
}
async function call(req,opts={}) {
  const res=response();
  await createHandler(opts)(req,res);
  return res;
}
test("disabled until every production enablement flag is present",async()=>{
  for(const key of ["ZQ_CHAT_ENABLED","ZQ_CHAT_LEADS_ENABLED","ZQ_AI_LEAD_ENABLED"]) {
    const cfg={...env,[key]:"false"};
    const r=await call(request(),{env:cfg,fetcher:()=>{throw new Error("Unexpected network")}});
    assert.equal(r.statusCode,503,key);
  }
});
test("refuses browser calls without exact Origin, session, consent or valid required details",async()=>{
  const dummy={env,fetcher:()=>{throw new Error("No network allowed")}};
  assert.equal((await call(request({}, {origin:"https://evil.example"}),dummy)).statusCode,403);
  assert.equal((await call(request({}, {cookie:"zq_chat_sid=fake"}),dummy)).statusCode,403);
  assert.equal((await call(request({consent:false}),dummy)).statusCode,400);
  assert.equal((await call(request({botcheck:"spammer"}),dummy)).statusCode,400);
  assert.equal((await call(request({lead:{...validLead(),phone:"xxx"}}),dummy)).statusCode,400);
  assert.equal((await call(request({dry_run:true}),dummy)).statusCode,400);
});
test("requires an existing Redis-backed chat session",async()=>{
  const services=fakeServices();
  services.storage.clear();
  const res=await call(request(),{env,fetcher:services.fetcher});
  assert.equal(res.statusCode,403);
  assert.equal(services.calls.filter(x=>x.pathname==="/api/ai-lead/").length,0);
});
test("one confirmed enquiry is sent once and replay is idempotent",async()=>{
  const services=fakeServices();
  const opts={env,fetcher:services.fetcher};
  const first=await call(request(),opts);
  assert.equal(first.statusCode,200);
  assert.equal(first.data.status,"accepted");
  assert.equal(first.data.submission_id,ID);
  const replay=await call(request({submission_id:crypto.randomUUID()}),opts);
  assert.equal(replay.statusCode,200);
  assert.equal(replay.data.status,"accepted");
  assert.equal(services.calls.filter(x=>x.pathname==="/api/ai-lead/").length,1);
  assert.ok(!JSON.stringify(replay.data).includes("server-token"));
});
test("conflicting details in the same chat do not resubmit",async()=>{
  const services=fakeServices();
  const opts={env,fetcher:services.fetcher};
  await call(request(),opts);
  const changed=await call(request({lead:{...validLead(),pickup_suburb:"Another suburb"}}),opts);
  assert.equal(changed.statusCode,409);
  assert.equal(services.calls.filter(x=>x.pathname==="/api/ai-lead/").length,1);
});
test("unknown provider delivery blocks automatic repeated sends",async()=>{
  const services=fakeServices("timeout");
  const opts={env,fetcher:services.fetcher};
  const failed=await call(request(),opts);
  assert.equal(failed.statusCode,502);
  assert.equal(failed.data.status,"unknown");
  const replay=await call(request(),opts);
  assert.equal(replay.statusCode,502);
  assert.equal(services.calls.filter(x=>x.pathname==="/api/ai-lead/").length,1);
});
test("pending is preserved and cannot be retried with a new id",async()=>{
  const services=fakeServices("pending");
  const opts={env,fetcher:services.fetcher};
  assert.equal((await call(request(),opts)).statusCode,202);
  const later=await call(request({submission_id:crypto.randomUUID()}),opts);
  assert.equal(later.statusCode,202);
  assert.equal(services.calls.filter(x=>x.pathname==="/api/ai-lead/").length,1);
});
