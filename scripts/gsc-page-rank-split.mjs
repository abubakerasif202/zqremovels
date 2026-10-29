// Splits a page's position change between two equal windows into query-mix vs same-query movement. Read-only. Usage: node scripts/gsc-page-rank-split.mjs
import { readFile } from 'node:fs/promises';
import { google } from 'googleapis';
const c = JSON.parse(await readFile(process.env.GSC_OAUTH_CLIENT_PATH || 'C:/Users/abuba/gsc-private/credentials.json','utf8')).installed;
const a = new google.auth.OAuth2(c.client_id, c.client_secret);
a.setCredentials(JSON.parse(await readFile('.gsc-token.json','utf8')));
const sc = google.searchconsole({ version:'v1', auth:a });
const site='sc-domain:zqremovalsadelaide.com.au';
const W={ early:['2026-08-30','2026-09-29'], late:['2026-09-30','2026-10-29'] };
const pages=['/removalists-adelaide-prices/','/same-day-removalists-adelaide/'];
const q=async(page,[s,e],dims)=> (await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:s,endDate:e,dimensions:dims,rowLimit:25000,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'equals',expression:'https://zqremovalsadelaide.com.au'+page}]}]}})).data.rows||[];
const agg=r=>{const i=r.reduce((s,x)=>s+x.impressions,0);return {rows:r.length,impr:i,clicks:r.reduce((s,x)=>s+x.clicks,0),pos:+(r.reduce((s,x)=>s+x.position*x.impressions,0)/i).toFixed(1)}};
for(const p of pages){
  console.log('=====',p);
  const rows={};
  for(const [k,w] of Object.entries(W)) rows[k]=await q(p,w,['query']);
  for(const k in rows) console.log(k,JSON.stringify(agg(rows[k])));
  const m=new Map();for(const k in rows)for(const r of rows[k]){const e=m.get(r.keys[0])||{};e[k]=r;m.set(r.keys[0],e)}
  const both=[...m].filter(([,e])=>e.early&&e.late);
  const onlyLate=[...m].filter(([,e])=>!e.early&&e.late), onlyEarly=[...m].filter(([,e])=>e.early&&!e.late);
  const wpos=(arr,k)=>{const i=arr.reduce((s,[,e])=>s+e[k].impressions,0);return {impr:i,pos:+(arr.reduce((s,[,e])=>s+e[k].position*e[k].impressions,0)/i).toFixed(1)}};
  console.log('shared queries',both.length,'early',JSON.stringify(wpos(both,'early')),'late',JSON.stringify(wpos(both,'late')));
  console.log('new in late',onlyLate.length,JSON.stringify(agg(onlyLate.map(([,e])=>e.late))),'dropped',onlyEarly.length,JSON.stringify(agg(onlyEarly.map(([,e])=>e.early))));
  console.log('biggest movers among shared (impr>=15 in both):');
  both.filter(([,e])=>e.early.impressions>=15&&e.late.impressions>=15).map(([k,e])=>[k,e.early.impressions,e.early.position,e.late.impressions,e.late.position]).sort((x,y)=>(y[4]-y[2])-(x[4]-x[2])).slice(0,6).forEach(x=>console.log(' ',x[0],'impr',x[1],'->',x[3],'pos',x[2].toFixed(1),'->',x[4].toFixed(1)));
  console.log('top late queries:');rows.late.sort((x,y)=>y.impressions-x.impressions).slice(0,8).forEach(r=>console.log(' ',r.keys[0],r.impressions,r.position.toFixed(1)));
  const d=(await q(p,['2026-08-30','2026-10-29'],['date'])).sort((x,y)=>x.keys[0]<y.keys[0]?-1:1);
  const wk=[];for(let i=0;i<d.length;i+=7){const s=d.slice(i,i+7);const im=s.reduce((t,x)=>t+x.impressions,0);wk.push(s[0].keys[0].slice(5)+':'+im+'@'+(s.reduce((t,x)=>t+x.position*x.impressions,0)/im).toFixed(0))}
  console.log('weekly impr@pos',wk.join(' '));
}
