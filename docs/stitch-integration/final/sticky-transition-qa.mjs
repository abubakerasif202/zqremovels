import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const results = [];
for (const width of [320,768,1024]) {
 const page = await browser.newPage({viewport:{width,height:900}});
 await page.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4180'?route.continue():route.abort());
 await page.goto('http://127.0.0.1:4180/removalists-glenelg/');
 await page.waitForSelector('#zq-chat-launcher');
 for(const top of [800,0,800]) {
  await page.evaluate(top=>scrollTo({top,behavior:'instant'}),top);
  await page.waitForTimeout(600);
  const collision=await page.evaluate(()=>{const sticky=document.querySelector('.sticky-mobile-cta');if(getComputedStyle(sticky).display==='none'||!sticky.classList.contains('is-visible'))return false;const a=sticky.getBoundingClientRect(),b=document.querySelector('.zq-chat-launcher').getBoundingClientRect();return a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y});
  expect(collision).toBe(false);results.push({width,scroll:top,collision});
 }
 await page.close();
}
await browser.close();await writeFile('docs/stitch-integration/final/sticky-transition-results.json',JSON.stringify(results,null,2));console.log(results);
