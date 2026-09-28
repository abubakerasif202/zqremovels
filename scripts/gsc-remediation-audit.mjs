import fs from "node:fs";
import path from "node:path";
fs.mkdirSync("tmp", { recursive: true });
const root = "site-dist",
  origin = "https://zqremovalsadelaide.com.au";
const files = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? files(path.join(d, e.name)) : [path.join(d, e.name)],
    );
const html = files(root).filter((f) => f.endsWith(".html"));
const fail = [];
const meta = [];
let faqSchemaQuestions = 0;
let unmatchedFaqSchemaQuestions = 0;
const requiredRoutes = [
  "/",
  "/removalists-adelaide/",
  "/removalists-hyde-park/",
  "/office-removals-adelaide/",
  "/removalists-unley-park/",
  "/removalists-adelaide-prices/",
  "/removalists-queens-park/",
  "/furniture-removalists-adelaide/",
  "/adelaide-moving-guides/removalists-cost-adelaide/",
];
for (const name of [
  "sitemap.xml",
  "sitemap-index.xml",
  "sitemap-pages.xml",
  "sitemap-services.xml",
  "sitemap-suburbs.xml",
  "sitemap-guides.xml",
]) {
  const file = path.join(root, name);
  if (!fs.existsSync(file) || !fs.readFileSync(file, "utf8").includes("<loc>"))
    fail.push("Missing or empty required sitemap: " + name);
}
if (!html.length) fail.push("No generated HTML pages");
const byPath = new Map();
for (const f of html) {
  const rel = path.relative(root, f).replaceAll("\\", "/");
  const url =
    rel === "index.html" ? "/" : "/" + rel.replace(/index\.html$/, "");
  byPath.set(url, f);
  if (rel.endsWith("/index.html")) byPath.set(url.slice(0, -1), f);
}
for (const route of requiredRoutes)
  if (!byPath.has(route)) fail.push("Missing priority route: " + route);
const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
for (const f of html) {
  const s = fs.readFileSync(f, "utf8");
  const rel = path.relative(root, f).replaceAll("\\", "/");
  const indexable = !/name="robots"[^>]*noindex/i.test(s);
  const canonical = s.match(/rel="canonical" href="([^"]+)"/)?.[1];
  const title = s.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = s.match(/name="description" content="([^"]+)"/)?.[1];
  const h1 = [...s.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gs)].map((m) =>
    m[1].replace(/<[^>]*>/g, ""),
  );
  meta.push({
    file: rel,
    title: decode(title || ""),
    description: decode(description || ""),
    canonical,
    h1,
    indexable,
  });
  if (indexable && h1.length !== 1) fail.push(`${rel}: ${h1.length} H1`);
  if (!canonical?.startsWith(origin + "/"))
    fail.push(`${rel}: nonpreferred canonical`);
  const text = s
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ");
  const normalizedVisibleText = decode(text).replace(/\s+/g, " ").trim().toLowerCase();
  if (
    /quote-ready|route trigger|service fit|guide support|this page is built|related intent|sibling page|built for search|research into|transparent-rate/i.test(
      text,
    )
  )
    fail.push(`${rel}: editorial language`);
  if (
    /fixed[- ]price (?:quotes?|model|proposal|guarantee|moving services)|rather than hourly|safer than an hourly|protecting you from hourly/i.test(
      text,
    )
  )
    fail.push(`${rel}: pricing contradiction`);
  const types = [];
  for (const m of s.matchAll(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      const obj = JSON.parse(m[1]);
      const visit = (x) => {
        if (!x || typeof x !== "object") return;
        if (x["@type"]) types.push(...[].concat(x["@type"]));
        if ([].concat(x["@type"] || []).includes("FAQPage")) {
          for (const question of x.mainEntity || []) {
            faqSchemaQuestions++;
            const name = decode(String(question?.name || "")).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
            const answer = decode(String(question?.acceptedAnswer?.text || "")).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
            if (!name || !answer || !normalizedVisibleText.includes(name) || !normalizedVisibleText.includes(answer)) {
              unmatchedFaqSchemaQuestions++;
              fail.push(`${rel}: FAQ schema is not visible: ${question?.name || "unnamed question"}`);
            }
          }
        }
        for (const [k, v] of Object.entries(x)) {
          if (
            ["url", "@id", "item"].includes(k) &&
            typeof v === "string" &&
            /zqremovals/.test(v) &&
            !v.startsWith(origin)
          )
            fail.push(`${rel}: schema host ${v}`);
          if (v && typeof v === "object") {
            if (Array.isArray(v)) v.forEach(visit);
            else visit(v);
          }
        }
      };
      visit(obj);
    } catch (e) {
      fail.push(`${rel}: invalid JSON-LD ${e.message}`);
    }
  }
  for (const type of ["FAQPage", "BreadcrumbList"])
    if (types.filter((t) => t === type).length > 1)
      fail.push(`${rel}: duplicate ${type}`);
  for (const m of s.matchAll(/href="(\/[^" ]*)"/g)) {
    let p = decode(m[1]).split(/[?#]/)[0];
    if (!p) continue;
    let fTarget = byPath.get(p) || path.join(root, p);
    if (!fs.existsSync(fTarget)) fail.push(`${rel}: broken href ${p}`);
  }
}
const indexable = meta.filter((x) => x.indexable);
if (!indexable.length) fail.push("No indexable generated pages");
for (const route of requiredRoutes) {
  const f = byPath.get(route);
  if (f && !meta.some((p) => path.join(root, p.file) === f && p.indexable))
    fail.push("Priority route is noindex: " + route);
}
for (const key of ["title", "h1"]) {
  const map = new Map();
  for (const p of indexable) {
    const value = key === "h1" ? p.h1.join("") : p.title;
    if (map.has(value))
      fail.push(`${p.file}: duplicate ${key} with ${map.get(value)}`);
    else map.set(value, p.file);
  }
}
let locs = 0;
for (const f of files(root).filter((f) => /sitemap.*\.xml$/.test(f))) {
  for (const m of fs.readFileSync(f, "utf8").matchAll(/<loc>(.*?)<\/loc>/g)) {
    const u = new URL(decode(m[1]));
    if (u.origin !== origin) fail.push(`${f}: sitemap host`);
    if (u.pathname.endsWith(".xml") || /image/.test(path.basename(f))) continue;
    locs++;
    const target = byPath.get(u.pathname);
    if (!target) fail.push(`${f}: sitemap missing ${u.pathname}`);
    else if (!meta.find((p) => path.join(root, p.file) === target)?.indexable)
      fail.push(`${f}: sitemap noindex ${u.pathname}`);
  }
}
fs.writeFileSync("tmp/generated-metadata.json", JSON.stringify(meta, null, 2));
const unique = [...new Set(fail)];
console.log(
  JSON.stringify(
    {
      htmlPages: html.length,
      indexable: indexable.length,
      sitemapLocs: locs,
      faqSchemaQuestions,
      unmatchedFaqSchemaQuestions,
      failures: unique,
    },
    null,
    2,
  ),
);
process.exitCode = unique.length ? 1 : 0;
