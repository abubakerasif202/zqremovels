import { chromium, webkit } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const widths = [320,360,375,390,430,768,1024,1440];
const routes = ['/', '/contact-us/', '/house-removals-adelaide/', '/apartment-removalists-adelaide/', '/office-removals-adelaide/', '/interstate-removals-adelaide/'];
const phase = process.argv[2] || 'after';
const results = [];
const axe = await readFile('node_modules/axe-core/axe.min.js', 'utf8');
for (const [name, engine] of [['chromium',chromium],['webkit',webkit]]) {
  let browser;
  try { browser = await engine.launch(); }
  catch { results.push({engine:name,status:'unavailable'}); continue; }
  const page = await browser.newPage();
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:3000)/, route => route.abort());
  // Absolute protection against sending enquiries, including a live server accidentally used locally.
  await page.route('**/api/**', route => route.abort());
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const route of routes) for (const width of widths) {
    await page.setViewportSize({width,height:900});
    const response = await page.goto('http://127.0.0.1:3000'+route);
    await page.waitForTimeout(100);
    const dimensions = await page.evaluate(() => ({
      overflow:document.documentElement.scrollWidth > innerWidth + 1,
      smallInputs:[...document.querySelectorAll('form[data-quote-form] input:not([type=hidden]),form[data-quote-form] select,form[data-quote-form] textarea')].filter(e => e.getBoundingClientRect().width && parseFloat(getComputedStyle(e).fontSize)<16).length,
      forms: document.querySelectorAll('form[data-quote-form]').length,
    }));
    let violations;
    if(width===390) {
      await page.addScriptTag({content:axe});
      violations = (await page.evaluate(async()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}))).violations.map(v=>({id:v.id,impact:v.impact,count:v.nodes.length}));
    }
    if ([320,390,1440].includes(width)) await page.screenshot({path:`artifacts/ads-recovery-2026-10-22/${phase}-${name}-${route.replaceAll('/','')||'home'}-${width}.png`,fullPage:true});
    results.push({engine:name,route,width,status:response.status(),...dimensions,violations,errors:errors.splice(0)});
  }
  await browser.close();
}
await writeFile(`artifacts/ads-recovery-2026-10-22/${phase}.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify({checks:results.length,failures:results.filter(r=>r.overflow||r.smallInputs||r.status>=400||r.errors?.length||r.violations?.length),unavailable:results.filter(r=>r.status==='unavailable')},null,2));

process.exitCode = results.some(r => r.overflow || r.smallInputs || r.status >= 400 || r.errors?.length || r.violations?.length || (r.engine === "chromium" && r.status === "unavailable")) ? 1 : 0;
