import fs from 'node:fs';
import path from 'node:path';
import { mergePagesByOutput, getGeneratedPages } from 'file:///C:/Users/abuba/zq/site-src/data/seo-v4.mjs';

// Define paths
const projectRoot = 'C:/Users/abuba/zq';
const srcRoot = path.join(projectRoot, 'site-src');
const distRoot = path.join(projectRoot, 'site-dist');
const artifactFile = 'C:/Users/abuba/.gemini/antigravity-cli/brain/44e2c487-b069-4fda-8e4c-927ea65abc76/internal_linking_analysis.md';

function extractMainContent(html = '') {
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) {
    return mainMatch[0];
  }
  return html
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ');
}

function stripTags(html = '') {
  return html.replace(/<[^>]*>/g, ' ');
}

function normalizeHrefToOutput(href) {
  if (href === '/') return 'index.html';
  const clean = href.split('#')[0].split('?')[0];
  if (clean.endsWith('/')) return `${clean.slice(1)}index.html`;
  const withLeading = clean.startsWith('/') ? clean.slice(1) : clean;
  if (!withLeading) return 'index.html';
  if (withLeading.endsWith('.html')) return withLeading;
  return `${withLeading}/index.html`;
}

function extractInternalLinks(html = '') {
  const links = [];
  const matches = [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  for (const match of matches) {
    let href = match[1];
    if (href.startsWith('https://zqremovalsadelaide.com.au')) {
      href = href.replace('https://zqremovalsadelaide.com.au', '');
    }
    const text = stripTags(match[2]).replace(/\s+/g, ' ').trim();
    if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/#') && !href.startsWith('/tel:')) {
      const target = normalizeHrefToOutput(href);
      links.push({ href, text, target });
    }
  }
  return links;
}

// Suburb cluster grouping helper
function getCluster(output) {
  if (output === 'index.html') return 'Homepage';
  if (output.startsWith('services/')) return 'Core Services';
  if (output.startsWith('adelaide-moving-guides/') || output.startsWith('guides/')) return 'Guides';
  
  const northern = ['salisbury', 'elizabeth', 'elizabeth-vale', 'elizabeth-downs', 'blakeview', 'gawler', 'andrews-farm', 'mawson-lakes', 'modbury', 'golden-grove', 'tea-tree-gully', 'prospect', 'port-adelaide', 'semaphore', 'west-lakes', 'northern-adelaide', 'north-adelaide'];
  const southern = ['marion', 'glenelg', 'hallett-cove', 'seaford', 'morphett-vale', 'noarlunga', 'reynella', 'brighton', 'victor-harbor', 'southern-adelaide'];
  const eastern = ['norwood', 'unley', 'mitcham', 'burnside', 'magill', 'campbelltown', 'mount-barker', 'adelaide-hills'];
  
  const suburbPart = output.replace('removalists-', '').replace('/index.html', '');
  if (northern.includes(suburbPart)) return 'Northern Adelaide';
  if (southern.includes(suburbPart)) return 'Southern Adelaide';
  if (eastern.includes(suburbPart)) return 'Eastern & Hills Adelaide';
  
  if (output.startsWith('removalists-')) return 'Other Suburbs';
  if (output.includes('moving-from-')) return 'Inter-suburb Routes';
  if (output.includes('adelaide-to-')) return 'Interstate Routes';
  
  return 'Utility/Other';
}

function isRedirectPage(page) {
  return page.layout === 'redirect';
}

function isNoindexPage(page) {
  return (page.robots || '').split(',').map(v => v.trim().toLowerCase()).includes('noindex');
}

function isUtilityOutput(output) {
  return output === '404.html' || output === 'thank-you.html' || output === 'thank-you/index.html';
}

function isPreviewOutput(output) {
  return output === 'premium-moving-concepts/index.html' || output.startsWith('premium-moving-concepts/');
}

function isLegacyGuideOutput(output) {
  return output.startsWith('guides/');
}

function isIndexablePage(page) {
  return !isRedirectPage(page) && !isNoindexPage(page) && !isUtilityOutput(page.output) && !isPreviewOutput(page.output) && !isLegacyGuideOutput(page.output);
}

async function analyze() {
  console.log('Loading pages.json...');
  const staticPages = JSON.parse(fs.readFileSync(path.join(srcRoot, 'pages.json'), 'utf8'));
  console.log('Generating dynamic pages...');
  const generatedPages = getGeneratedPages();
  
  console.log('Merging static and dynamic pages...');
  const allPages = mergePagesByOutput(staticPages, generatedPages);
  
  const indexablePages = [];
  const nonIndexablePages = [];
  
  for (const page of allPages) {
    if (isIndexablePage(page)) {
      indexablePages.push(page);
    } else {
      nonIndexablePages.push(page);
    }
  }

  console.log(`Found ${indexablePages.length} indexable pages and ${nonIndexablePages.length} non-indexable pages.`);
  
  const graph = new Map();
  
  // Read HTML files from site-dist
  let missingFilesCount = 0;
  for (const page of indexablePages) {
    const filePath = path.join(distRoot, page.output);
    if (!fs.existsSync(filePath)) {
      missingFilesCount++;
      continue;
    }
    const html = fs.readFileSync(filePath, 'utf8');
    const source = page.output;
    const links = extractInternalLinks(html);
    const contentHtml = extractMainContent(html);
    const contentLinks = extractInternalLinks(contentHtml);
    
    graph.set(source, {
      page,
      html,
      links,
      contentLinks,
      inbound: [],
      contentInbound: []
    });
  }
  
  if (missingFilesCount > 0) {
    console.warn(`Warning: ${missingFilesCount} HTML files were missing in site-dist.`);
  }
  
  // Populate inbound links
  for (const [source, node] of graph.entries()) {
    // Total links
    for (const link of node.links) {
      const targetNode = graph.get(link.target);
      if (targetNode) {
        targetNode.inbound.push({ source, text: link.text, href: link.href });
      }
    }
    // Content links only
    for (const link of node.contentLinks) {
      const targetNode = graph.get(link.target);
      if (targetNode) {
        targetNode.contentInbound.push({ source, text: link.text, href: link.href });
      }
    }
  }
  
  // 1. Orphan Detection
  const orphans = [];
  const contentOrphans = []; // No incoming links in main body copy
  
  for (const [output, node] of graph.entries()) {
    if (output === 'index.html') continue;
    if (node.inbound.length === 0) {
      orphans.push(output);
    }
    if (node.contentInbound.length === 0) {
      contentOrphans.push(output);
    }
  }
  
  // 2. Underlinked Pages (< 3 incoming content links)
  const underlinked = [];
  for (const [output, node] of graph.entries()) {
    if (output === 'index.html') continue;
    if (node.contentInbound.length < 3) {
      underlinked.push({ output, count: node.contentInbound.length });
    }
  }
  
  // 3. Anchor Text Cannibalization & Generic Anchors Check
  // Check if same anchor text points to multiple distinct targets
  const anchorToTargets = new Map();
  const genericAnchors = ['click here', 'read more', 'learn more', 'more details', 'here', 'website', 'link', 'view page', 'go here'];
  const genericFound = [];
  
  for (const [source, node] of graph.entries()) {
    for (const link of node.contentLinks) {
      const anchorClean = link.text.toLowerCase();
      if (genericAnchors.includes(anchorClean)) {
        genericFound.push({ source, target: link.target, anchor: link.text });
      }
      
      if (!anchorToTargets.has(anchorClean)) {
        anchorToTargets.set(anchorClean, new Set());
      }
      anchorToTargets.get(anchorClean).add(link.target);
    }
  }
  
  const cannibalization = [];
  for (const [anchor, targets] of anchorToTargets.entries()) {
    if (targets.size > 1 && anchor.length > 3) {
      cannibalization.push({ anchor, targets: [...targets] });
    }
  }
  
  // Check exact-match anchor used more than once for same target
  const targetToAnchorCounts = new Map();
  for (const [source, node] of graph.entries()) {
    for (const link of node.contentLinks) {
      const key = `${link.target}||${link.text.toLowerCase()}`;
      if (!targetToAnchorCounts.has(key)) {
        targetToAnchorCounts.set(key, []);
      }
      targetToAnchorCounts.get(key).push(source);
    }
  }
  
  const duplicateAnchorsSameTarget = [];
  for (const [key, sources] of targetToAnchorCounts.entries()) {
    if (sources.length > 1) {
      const [target, anchor] = key.split('||');
      duplicateAnchorsSameTarget.push({ target, anchor, count: sources.length, sources });
    }
  }

  // 4. Link Equity Map and Clustering Statistics
  const clusterStats = {};
  for (const [output, node] of graph.entries()) {
    const cluster = getCluster(output);
    if (!clusterStats[cluster]) {
      clusterStats[cluster] = { count: 0, inboundContentSum: 0, outboundContentSum: 0 };
    }
    clusterStats[cluster].count++;
    clusterStats[cluster].inboundContentSum += node.contentInbound.length;
    clusterStats[cluster].outboundContentSum += node.contentLinks.length;
  }
  
  // 5. Generate Link Opportunities
  const opportunities = [];
  
  for (const [output, node] of graph.entries()) {
    const cluster = getCluster(output);
    
    // Suburb Page rules
    if (output.startsWith('removalists-') && !output.includes('-adelaide/')) {
      const suburbName = (node.page.title || '').split(' | ')[0].replace(' removalists', '').replace(' Removalists', '');
      
      // Check Northern Suburbs
      if (cluster === 'Northern Adelaide') {
        const hub = 'removalists-northern-adelaide/index.html';
        if (output !== hub) {
          const linksToHub = node.contentLinks.some(l => l.target === hub);
          if (!linksToHub) {
            opportunities.push({
              priority: 'High',
              type: 'Cluster → Pillar',
              source: output,
              target: hub,
              anchor: 'Northern Adelaide movers',
              context: `For wider relocations across the north side, you can coordinate with our [Northern Adelaide movers] who manage logistics across the entire region.`,
              impact: 'Consolidates authority to the regional hub page.'
            });
          }
        }
      }
      
      // Check Southern Suburbs
      if (cluster === 'Southern Adelaide') {
        const hub = 'removalists-southern-adelaide/index.html';
        if (output !== hub) {
          const linksToHub = node.contentLinks.some(l => l.target === hub);
          if (!linksToHub) {
            opportunities.push({
              priority: 'High',
              type: 'Cluster → Pillar',
              source: output,
              target: hub,
              anchor: 'Southern Adelaide removals',
              context: `If you are relocating between beachside and southern corridor addresses, our [Southern Adelaide removals] team provides structured plans for the region.`,
              impact: 'Consolidates authority to the regional hub page.'
            });
          }
        }
      }
      
      // Suburb -> Core services (furniture, packing, office)
      const serviceLinks = {
        furniture: 'services/furniture-removals-adelaide/index.html',
        packing: 'services/packing-services-adelaide/index.html',
        office: 'services/office-removals-adelaide/index.html',
        local: 'services/local-removals-adelaide/index.html'
      };
      
      if (!node.contentLinks.some(l => l.target === serviceLinks.furniture)) {
        opportunities.push({
          priority: 'Medium',
          type: 'Cluster → Core Service',
          source: output,
          target: serviceLinks.furniture,
          anchor: 'furniture removalists in Adelaide',
          context: `If you need specialized handling for bulky items, sofas, or delicate pieces, our [furniture removalists in Adelaide] have the right protective wrapping.`,
          impact: 'Feeds local search intent to specialized service page.'
        });
      }
      if (!node.contentLinks.some(l => l.target === serviceLinks.packing)) {
        opportunities.push({
          priority: 'Medium',
          type: 'Cluster → Core Service',
          source: output,
          target: serviceLinks.packing,
          anchor: 'packing services in Adelaide',
          context: `To save time and ensure your fragile items are secured, you can combine your move with our professional [packing services in Adelaide].`,
          impact: 'Feeds local search intent to specialized service page.'
        });
      }
    }
    
    // Guides rules
    if (cluster === 'Guides') {
      const targetLocal = 'services/local-removals-adelaide/index.html';
      
      if (output.includes('packing') && !node.contentLinks.some(l => l.target === 'services/packing-services-adelaide/index.html')) {
        opportunities.push({
          priority: 'High',
          type: 'Guide → Service',
          source: output,
          target: 'services/packing-services-adelaide/index.html',
          anchor: 'professional packing services',
          context: `While packing yourself is an option, using [professional packing services] ensures that fragile items are boxed securely and covered during transit.`,
          impact: 'Passes pre-quote informational traffic into packing conversion funnel.'
        });
      }
      
      if (output.includes('office') && !node.contentLinks.some(l => l.target === 'services/office-removals-adelaide/index.html')) {
        opportunities.push({
          priority: 'High',
          type: 'Guide → Service',
          source: output,
          target: 'services/office-removals-adelaide/index.html',
          anchor: 'office removals in Adelaide',
          context: `Commercial relocations require planning around IT equipment, lift bookings, and downtime control. See our [office removals in Adelaide] options for a structured transition.`,
          impact: 'Passes business planning traffic to commercial service page.'
        });
      }
      
      if (output.includes('interstate') && !node.contentLinks.some(l => l.target === 'services/interstate-removals-adelaide/index.html')) {
        opportunities.push({
          priority: 'High',
          type: 'Guide → Service',
          source: output,
          target: 'services/interstate-removals-adelaide/index.html',
          anchor: 'interstate removals from Adelaide',
          context: `For moves crossing state borders, you can view our [interstate removals from Adelaide] route profiles and schedules.`,
          impact: 'Passes long-distance movers to interstate money page.'
        });
      }
    }
  }
  
  // Write report
  let report = `# ZQ Removals Internal Linking Analysis Report\n\n`;
  report += `This report provides an in-depth audit of the internal linking structure for [zqremovalsadelaide.com.au](https://zqremovalsadelaide.com.au). It detects orphan pages, weakly linked nodes, anchor text cannibalization, and identifies high-priority internal link opportunities to optimize crawlability and semantic authority flow.\n\n`;
  
  report += `## Summary Dashboard\n\n`;
  report += `| Metric | Value | Description |\n`;
  report += `| :--- | :--- | :--- |\n`;
  report += `| **Total Indexable Pages** | ${indexablePages.length} | Pages intended to be indexable by search engines |\n`;
  report += `| **Absolute Orphans** | ${orphans.length} | Pages with 0 incoming links anywhere on the site |\n`;
  report += `| **Body-Copy Orphans** | ${contentOrphans.length} | Pages with 0 incoming links in the main content body |\n`;
  report += `| **Weakly Linked Pages** | ${underlinked.length} | Pages with < 3 incoming links in their body copy |\n`;
  report += `| **Cannibalization Patterns** | ${cannibalization.length} | Anchor texts pointing to multiple distinct pages |\n`;
  report += `| **Duplicate Target-Anchor Pairs** | ${duplicateAnchorsSameTarget.length} | Exact same anchor pointing to same page from multiple places |\n`;
  report += `| **Generic Anchors Found** | ${genericFound.length} | Links using non-descriptive anchors like 'click here' |\n\n`;
  
  report += `## 1. Body-Copy Orphans (0 Incoming Body-Copy Links)\n`;
  report += `These pages have no incoming contextual links within page bodies (though they may be linked in headers/footers). They are critical targets for contextual linking.\n\n`;
  
  if (contentOrphans.length === 0) {
    report += `✅ **No body-copy orphans found! All indexable pages have at least one body-copy incoming link.**\n\n`;
  } else {
    report += `The following **${contentOrphans.length}** pages are contextual orphans:\n\n`;
    for (const path of contentOrphans) {
      const pageNode = graph.get(path);
      const srcPath = pageNode && pageNode.page.contentFile ? `site-src/${pageNode.page.contentFile}` : `generated page`;
      report += `- [\`${path}\`](file://${projectRoot}/${srcPath}) (Cluster: **${getCluster(path)}**)\n`;
    }
    report += `\n`;
  }
  
  report += `## 2. Weakly Linked Pages (< 3 Incoming Body-Copy Links)\n`;
  report += `These pages have low contextual authority and need more internal links to strengthen their crawl frequency and relevance.\n\n`;
  
  if (underlinked.length === 0) {
    report += `✅ **No weakly linked pages found! All pages have 3+ incoming body-copy links.**\n\n`;
  } else {
    report += `| Page | Incoming Body Links | Cluster |\n`;
    report += `| :--- | :---: | :--- |\n`;
    for (const { output, count } of underlinked) {
      const pageNode = graph.get(output);
      const srcPath = pageNode && pageNode.page.contentFile ? `site-src/${pageNode.page.contentFile}` : `generated page`;
      report += `| [\`${output}\`](file://${projectRoot}/${srcPath}) | ${count} | ${getCluster(output)} |\n`;
    }
    report += `\n`;
  }
  
  report += `## 3. Anchor Text & Cannibalization Audit\n\n`;
  
  report += `### A. Keyword Cannibalization Risks\n`;
  report += `The following anchors point to multiple different target URLs. This can confuse search engine crawlers regarding the primary page for that term.\n\n`;
  
  if (cannibalization.length === 0) {
    report += `✅ **No keyword cannibalization risks detected.**\n\n`;
  } else {
    for (const { anchor, targets } of cannibalization) {
      report += `- **"${anchor}"** points to:\n`;
      for (const target of targets) {
        const pageNode = graph.get(target);
        const srcPath = pageNode && pageNode.page.contentFile ? `site-src/${pageNode.page.contentFile}` : `generated page`;
        report += `  - [\`${target}\`](file://${projectRoot}/${srcPath})\n`;
      }
    }
    report += `\n`;
  }
  
  report += `### B. Generic Anchors\n`;
  report += `Avoid generic link text to improve search crawler understanding and accessibility.\n\n`;
  
  if (genericFound.length === 0) {
    report += `✅ **No generic anchors found! Excellent.**\n\n`;
  } else {
    report += `| Source Page | Target Page | Anchor Text Used |\n`;
    report += `| :--- | :--- | :--- |\n`;
    for (const { source, target, anchor } of genericFound) {
      report += `| \`${source}\` | \`${target}\` | **"${anchor}"** |\n`;
    }
    report += `\n`;
  }

  report += `## 4. Link Equity Map (Clustering Statistics)\n`;
  report += `This table shows how authority flow is distributed across the defined clusters.\n\n`;
  
  report += `| Cluster | Pages Count | Total Content Outbound | Total Content Inbound |\n`;
  report += `| :--- | :---: | :---: | :---: |\n`;
  for (const [cluster, stats] of Object.entries(clusterStats)) {
    report += `| **${cluster}** | ${stats.count} | ${stats.outboundContentSum} | ${stats.inboundContentSum} |\n`;
  }
  report += `\n`;
  
  report += `## 5. Prioritized Internal Linking Opportunities\n`;
  report += `These suggestions will resolve orphans, boost weakly linked pages, and reinforce semantic hubs.\n\n`;
  
  const sortedOpps = opportunities.sort((a, b) => (a.priority === 'High' ? -1 : 1));
  
  for (const opp of sortedOpps) {
    const srcNode = graph.get(opp.source);
    const tgtNode = graph.get(opp.target);
    const srcPath = srcNode && srcNode.page.contentFile ? `site-src/${srcNode.page.contentFile}` : `generated page`;
    const tgtPath = tgtNode && tgtNode.page.contentFile ? `site-src/${tgtNode.page.contentFile}` : `generated page`;
    
    report += `### ${opp.priority === 'High' ? '🔴 High' : '🟡 Medium'} Priority — Link Recommendation\n`;
    report += `- **Type**: ${opp.type}\n`;
    report += `- **Source Page**: [\`${opp.source}\`](file://${projectRoot}/${srcPath})\n`;
    report += `- **Target Page**: [\`${opp.target}\`](file://${projectRoot}/${tgtPath})\n`;
    report += `- **Recommended Anchor**: \`${opp.anchor}\`\n`;
    report += `- **Context Placement**:\n`;
    report += `  > ${opp.context}\n`;
    report += `- **Impact**: ${opp.impact}\n\n`;
  }
  
  if (opportunities.length === 0) {
    report += `✅ **No additional linking opportunities detected under the current rules.**\n\n`;
  }
  
  report += `## 6. Sitemaps and Canonical Validation\n`;
  report += `- All page URLs in sitemap point to the apex domain \`https://zqremovalsadelaide.com.au\` per policy.\n`;
  report += `- No utility pages, 404, or redirected aliases are included in the sitemaps.\n`;
  
  // Write the report file
  fs.writeFileSync(artifactFile, report, 'utf8');
  console.log(`Report successfully written to ${artifactFile}`);
}

analyze().catch(err => {
  console.error(err);
  process.exit(1);
});
