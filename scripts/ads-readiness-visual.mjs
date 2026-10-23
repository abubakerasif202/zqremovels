import { chromium, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const phase=process.argv[2]||'baseline';
if(!/^[a-z0-9-]+$/.test(phase)) throw new Error('Invalid phase');
const dir='artifacts/ads-recovery-2026-10-22/readiness';
await mkdir(dir,{recursive:true});
const routes=['/','/contact-us/','/house-removals-adelaide/','/apartment-removalists-adelaide/','/office-removals-adelaide/','/interstate-removals-adelaide/'];
const widths=[320,360,375,390,430,768,1024,1440];
const results=[];
for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]) {
 let browser;
 try{browser=await type.launch();}catch(e){results.push({engine,status:'unavailable',reason:e.message.includes('missing dependencies')?'Missing operating-system libraries':e.message.split('\n')[0]});continue;}
 try {
 const page=await browser.newPage({reducedMotion:'reduce'});
 await page.route(/^https?:\/\/(?!127\.0\.0\.1:3000)/,r=>r.abort());
 await page.route('**/api/**',r=>r.abort());
 for(const route of routes)for(const width of widths){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:3000'+route);
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
  const slug=route.replaceAll('/','')||'home';
  const dimensions=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
  const file=`${phase}-${engine}-${slug}-${width}.png`;
  await page.screenshot({path:`${dir}/${file}`,fullPage:true,animations:'disabled'});
  results.push({engine,route,...dimensions,file});
 }
 }finally{await browser.close();}
}
await writeFile(`${dir}/${phase}-visual.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify({checks:results.filter(r=>r.status!=='unavailable').length,overflow:results.filter(r=>r.scrollWidth>r.width+1),unavailable:results.filter(r=>r.status==='unavailable')},null,2));
if(results.some(r=>r.scrollWidth>r.width+1))process.exitCode=1;
