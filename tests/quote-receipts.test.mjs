import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { createReceiptStore }=createRequire(import.meta.url)('../lib/server/quote-receipts.js');
const id='3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14';
const env={KV_REST_API_URL:'https://fixture-store.example',KV_REST_API_TOKEN:'fixture-token'};
function redisFixture(){
 let now=0;
 const entries=new Map(),commands=[];
 const fetcher=async(url,options)=>{
  assert.equal(url,env.KV_REST_API_URL+'/');assert.equal(options.redirect,'error');
  assert.equal(options.headers.Authorization,'Bearer fixture-token');assert.ok(options.signal instanceof AbortSignal);
  const args=JSON.parse(options.body);commands.push(args);const [cmd,key,value,...flags]=args;
  if(entries.has(key)&&entries.get(key).until<=now)entries.delete(key);
  let result=null;
  if(cmd==='GET')result=entries.get(key)?.value??null;
  else if(cmd==='SET'){
   assert.equal(flags[0],'EX');assert.equal(flags[1],604800);
   if((flags.includes('NX')&&!entries.has(key))||(flags.includes('XX')&&entries.has(key))){
    entries.set(key,{value,until:now+flags[1]*1000});result='OK';
   }
  }else assert.fail('Unexpected fixture command');
  return {ok:true,json:async()=>({result})};
 };
 return {store:createReceiptStore(env,fetcher),commands,advance:ms=>{now+=ms;}};
}
test('atomic concurrent NX claims produce a single delivery owner and matching replay',async()=>{
 const f=redisFixture();const payload={message:'fixture only'};
 const claims=await Promise.all([f.store.claim(id,payload),f.store.claim(id,payload)]);
 assert.equal(claims.filter(c=>c.fresh).length,1);
 assert.equal(claims.filter(c=>!c.fresh&&c.record.status==='pending').length,1);
 await f.store.accept(claims.find(c=>c.fresh));
 assert.equal((await f.store.lookup(id,payload)).record.status,'accepted');
 assert.equal((await f.store.lookup(id,{message:'different fixture'})).conflict,true);
});
test('receipt TTL is seven days and lookup never renews it',async()=>{
 const f=redisFixture();await f.store.claim(id,{});f.advance(604799000);
 assert.equal((await f.store.lookup(id,{})).record.status,'pending');f.advance(1000);
 assert.equal(await f.store.lookup(id,{}),null);
 assert.equal(f.commands.filter(c=>c[0]==='SET').length,1);
});
test('XX acceptance cannot resurrect expired or absent receipts',async()=>{
 const f=redisFixture();const claim=await f.store.claim(id,{});f.advance(604800000);
 await assert.rejects(f.store.accept(claim),/Receipt store unavailable/);
 assert.equal(await f.store.lookup(id,{}),null);
});
test('explicit rejection is a non-accepted durable terminal state',async()=>{
 const f=redisFixture();const claim=await f.store.claim(id,{});await f.store.reject(claim);
 assert.equal((await f.store.lookup(id,{})).record.status,'rejected');
});
for(const [name,response]of [
 ['HTTP error',{ok:false,json:async()=>({result:null})}],
 ['Redis error',{ok:true,json:async()=>({error:'fixture ACL failure'})}],
 ['invalid envelope',{ok:true,json:async()=>({})}],
 ['malformed JSON',{ok:true,json:async()=>{throw new SyntaxError('fixture')}}],
 ['corrupt record',{ok:true,json:async()=>({result:'{"status":"accepted"}'})}],
])test(`receipt lookup fails closed for ${name}`,async()=>{
 const store=createReceiptStore(env,async()=>response);await assert.rejects(store.lookup(id,{}));
});
test('invalid transport configuration and UUID cause no network request',async()=>{
 const fail=async()=>assert.fail('No request expected');
 await assert.rejects(createReceiptStore({KV_REST_API_URL:'http://fixture',KV_REST_API_TOKEN:'fixture'},fail).lookup(id,{}));
 await assert.rejects(createReceiptStore(env,fail).claim('invalid',{}));
});
