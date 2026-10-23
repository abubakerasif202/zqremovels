// Comparable local lab measurements only. Google endpoints are blocked; forms are never submitted.
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const phase = process.argv[2] || 'baseline';
if (!/^[a-z0-9-]+$/.test(phase)) throw new Error('Use an alphanumeric report phase');
const dir = 'artifacts/ads-recovery-2026-10-22/readiness';
await mkdir(dir, { recursive:true });
const runs=[];
for(let i=1;i<=3;i++) {
 const browser=await chromium.launch({args:['--remote-debugging-port=9223']});
 try {
  const result=await lighthouse('http://127.0.0.1:3000/',{
   port:9223,hostname:'127.0.0.1',output:'json',logLevel:'error',onlyCategories:['performance'],maxWaitForLoad:15000,
   blockedUrlPatterns:['*googletagmanager.com/*','*google-analytics.com/*','*googleadservices.com/*','*doubleclick.net/*','*google.com/*','*googleapis.com/*','*gstatic.com/*'],
  });
  if(result.lhr.runtimeError) throw new Error(result.lhr.runtimeError.code);
  await writeFile(`${dir}/${phase}-${i}.json`,result.report);
  runs.push({score:result.lhr.categories.performance.score*100,lcp:result.lhr.audits['largest-contentful-paint'].numericValue,tbt:result.lhr.audits['total-blocking-time'].numericValue,cls:result.lhr.audits['cumulative-layout-shift'].numericValue});
 } finally {await browser.close();}
}
const median=k=>runs.map(r=>r[k]).sort((a,b)=>a-b)[1];
const summary={phase,runs,median:Object.fromEntries(['score','lcp','tbt','cls'].map(k=>[k,median(k)])),conditions:'Lighthouse mobile simulated throttling; fresh Chromium per run; uncompressed local static server; same URL and blocked third-party endpoints; no concurrent builds/browser audits'};
await writeFile(`${dir}/${phase}-summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
