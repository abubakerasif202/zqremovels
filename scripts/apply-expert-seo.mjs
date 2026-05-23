import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

async function applyExpertSEO() {
  console.log('🚀 Starting 30-Year Expert SEO Injection...\n');

  try {
    // 1. Inject Advanced Meta & JSON-LD into pages.json
    console.log('📦 1. Updating site-src/pages.json (Meta & Entity Schema)...');
    const pagesPath = path.join(ROOT_DIR, 'site-src', 'pages.json');
    const pagesData = await fs.readFile(pagesPath, 'utf8');
    let pages = JSON.parse(pagesData);
    
    const homeIndex = pages.findIndex(p => p.output === 'index.html');
    if (homeIndex !== -1) {
      pages[homeIndex].title = "Adelaide Removalists | Fixed-Price Movers | ZQ Removals";
      pages[homeIndex].description = "Need Adelaide removalists? ZQ Removals covers Andrews Farm and metro Adelaide with fixed-price quotes and careful furniture handling.";
      pages[homeIndex].ogTitle = pages[homeIndex].title;
      pages[homeIndex].ogDescription = pages[homeIndex].description;
      pages[homeIndex].twitterTitle = pages[homeIndex].title;
      pages[homeIndex].twitterDescription = pages[homeIndex].description;
      
      // Upgrade from LocalBusiness to MovingCompany using only visible, verified business facts.
      pages[homeIndex].jsonLd = [
        JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MovingCompany",
          "@id": "https://zqremovals.au/#localbusiness",
          "name": "ZQ Removals Adelaide",
          "url": "https://zqremovals.au/",
          "telephone": "+61 433 819 989",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Andrews Farm SA 5114",
            "addressLocality": "Andrews Farm",
            "addressRegion": "SA",
            "postalCode": "5114",
            "addressCountry": "AU"
          },
          "areaServed": "Adelaide"
        }, null, 2)
      ];
      await fs.writeFile(pagesPath, JSON.stringify(pages, null, 2));
      console.log('✅ Homepage metadata and MovingCompany Schema upgraded.');
    }

    // 2. Eradicate Cannibalization in vercel.json
    console.log('\n🔀 2. Patching vercel.json (Anti-Cannibalization 301 Redirects)...');
    const vercelPath = path.join(ROOT_DIR, 'vercel.json');
    const vercelData = await fs.readFile(vercelPath, 'utf8');
    let vercel = JSON.parse(vercelData);
    
    if (!vercel.redirects) vercel.redirects = [];
    const expertRedirects = [
      { source: "/:slug(.*-cheap-move.*)", destination: "/affordable-removalists-adelaide/", permanent: true },
      { source: "/:slug(.*-budget-movers.*)", destination: "/affordable-removalists-adelaide/", permanent: true },
      { source: "/:slug(.*-discount-removals.*)", destination: "/affordable-removalists-adelaide/", permanent: true },
      { source: "/cheap-removalist-adelaide", destination: "/affordable-removalists-adelaide/", permanent: true }
    ];

    let redirectsAdded = 0;
    expertRedirects.forEach(newRedir => {
      // Prevent duplicates
      if (!vercel.redirects.find(r => r.source === newRedir.source)) {
        vercel.redirects.push(newRedir);
        redirectsAdded++;
      }
    });
    
    await fs.writeFile(vercelPath, JSON.stringify(vercel, null, 2));
    console.log(`✅ ${redirectsAdded} new wildcard redirects injected.`);

    // 3. Global Footer Microdata (NAP Consistency)
    console.log('\n🏢 3. Upgrading site-src/partials/footer.html (Local Authority Microdata)...');
    const footerPath = path.join(ROOT_DIR, 'site-src', 'partials', 'footer.html');
    let footerHtml = await fs.readFile(footerPath, 'utf8');
    
    const newFooterAddress = `<address class="nap" itemscope itemtype="https://schema.org/MovingCompany">
        <strong itemprop="name">ZQ Removals Adelaide</strong>
        <span itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
          <span itemprop="addressLocality">Andrews Farm</span> <span itemprop="addressRegion">SA</span> <span itemprop="postalCode">5114</span>
        </span>
        <span>ABN 97 954 095 119</span>
        <a href="tel:+61433819989" itemprop="telephone">0433 819 989</a>
      </address>`;
      
    footerHtml = footerHtml.replace(/<address class="nap">[\s\S]*?<\/address>/, newFooterAddress);
    await fs.writeFile(footerPath, footerHtml);
    console.log('✅ Global footer NAP explicitly mapped to Schema.org standards.');

    // 4. Semantic H1 Overhaul on Homepage
    console.log('\n📝 4. Fixing site-src/content/index.html (Semantic H1 Structure)...');
    const indexPath = path.join(ROOT_DIR, 'site-src', 'content', 'index.html');
    let indexHtml = await fs.readFile(indexPath, 'utf8');
    
    const newHeroHeadings = `<h1 class="main-title">Adelaide Removalists</h1>
        <span class="eyebrow h2-styled">Fixed-Price Local Movers in Adelaide</span>`;
        
    indexHtml = indexHtml.replace(/<h1>.*?<\/h1>\s*<span class="eyebrow".*?>.*?<\/span>/i, newHeroHeadings);
    await fs.writeFile(indexPath, indexHtml);
    console.log('✅ Hero headers semantically structured.');

    console.log('\n🎉 ALL EXPERT SEO FIXES APPLIED SUCCESSFULLY!');
    console.log('👉 Next Step: Run `npm run build` to generate the updated static files.');

  } catch (error) {
    console.error('\n❌ Error applying SEO fixes:', error);
  }
}

applyExpertSEO();
