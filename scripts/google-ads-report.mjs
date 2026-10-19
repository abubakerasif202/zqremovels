// Read-only Google Ads report for the ZQ Removals account. It only calls googleAds:searchStream
// (GAQL SELECT queries); nothing here can create, edit, pause or remove anything.
//
// Required environment (never commit these):
//   GOOGLE_ADS_DEVELOPER_TOKEN   developer token from the Ads manager account (Tools > API Center)
//   GOOGLE_ADS_CUSTOMER_ID       10-digit customer ID of the advertiser account (dashes optional)
// Optional:
//   GOOGLE_ADS_LOGIN_CUSTOMER_ID manager (MCC) ID, when the advertiser account is accessed through one
//   GOOGLE_ADS_API_VERSION       e.g. v21; otherwise the newest version that responds is used
//   GOOGLE_ADS_ACCESS_TOKEN      OAuth token with the adwords scope; otherwise taken from
//                                `gcloud auth application-default print-access-token`
//   GOOGLE_ADS_DURING            GAQL date range, default LAST_30_DAYS
import { execFileSync } from 'node:child_process';

const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/\D/g, '');
const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/\D/g, '');
const during = /^[A-Z_]+$/.test(process.env.GOOGLE_ADS_DURING || '') ? process.env.GOOGLE_ADS_DURING : 'LAST_30_DAYS';
const versions = process.env.GOOGLE_ADS_API_VERSION ? [process.env.GOOGLE_ADS_API_VERSION] : ['v23', 'v22', 'v21', 'v20', 'v19'];

if (!developerToken || customerId.length !== 10) {
  console.error('Set GOOGLE_ADS_DEVELOPER_TOKEN and a 10-digit GOOGLE_ADS_CUSTOMER_ID. See the header of this file.');
  process.exit(2);
}

function accessToken() {
  if (process.env.GOOGLE_ADS_ACCESS_TOKEN) return process.env.GOOGLE_ADS_ACCESS_TOKEN;
  try {
    return execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], { encoding: 'utf8', shell: process.platform === 'win32' }).trim();
  } catch {
    console.error('No access token. Run: gcloud auth application-default login --scopes=https://www.googleapis.com/auth/adwords,https://www.googleapis.com/auth/cloud-platform');
    process.exit(2);
  }
}

const token = accessToken();
let activeVersion = null;

async function search(query) {
  const candidates = activeVersion ? [activeVersion] : versions;
  let lastError = '';
  for (const version of candidates) {
    const response = await fetch(`https://googleads.googleapis.com/${version}/customers/${customerId}/googleAds:searchStream`, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Bearer ${token}`,
        'developer-token': developerToken,
        ...(loginCustomerId ? { 'login-customer-id': loginCustomerId } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    const text = await response.text();
    if (response.status === 404) { lastError = `${version}: not available`; continue; }
    if (!response.ok) {
      let detail = text.slice(0, 400);
      try { detail = JSON.parse(text).error?.message || detail; } catch { /* keep raw text */ }
      throw new Error(`Google Ads API ${response.status} (${version}): ${detail}`);
    }
    activeVersion = version;
    return JSON.parse(text).flatMap(chunk => chunk.results || []);
  }
  throw new Error(`No supported API version responded (${lastError})`);
}

const money = micros => (Number(micros || 0) / 1e6).toFixed(2);
const num = value => Number(value || 0);
const row = cells => `| ${cells.join(' | ')} |`;

const campaigns = await search(`
  SELECT campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type,
         campaign_budget.amount_micros, metrics.impressions, metrics.clicks, metrics.cost_micros,
         metrics.conversions, metrics.all_conversions, metrics.search_impression_share
  FROM campaign WHERE segments.date DURING ${during} AND campaign.status != 'REMOVED'
  ORDER BY metrics.cost_micros DESC`);

console.log(`# Google Ads read-only report (${during}, API ${activeVersion})\n`);
console.log('## Campaigns\n');
console.log(row(['Campaign', 'Status', 'Type', 'Daily budget', 'Impr.', 'Clicks', 'Cost', 'Conv.', 'All conv.', 'Cost/conv.', 'Impr. share']));
console.log(row(Array(11).fill('---')));
for (const r of campaigns) {
  const m = r.metrics || {};
  const conv = num(m.conversions);
  console.log(row([
    r.campaign.name, r.campaign.status, r.campaign.advertisingChannelType, money(r.campaignBudget?.amountMicros),
    num(m.impressions), num(m.clicks), money(m.costMicros), conv.toFixed(1), num(m.allConversions).toFixed(1),
    conv ? (num(m.costMicros) / 1e6 / conv).toFixed(2) : 'n/a',
    m.searchImpressionShare === undefined ? 'n/a' : `${(num(m.searchImpressionShare) * 100).toFixed(0)}%`,
  ]));
}

const actions = await search(`
  SELECT conversion_action.name, conversion_action.status, conversion_action.type, conversion_action.category,
         conversion_action.primary_for_goal, conversion_action.counting_type, conversion_action.tag_snippets,
         metrics.all_conversions
  FROM conversion_action WHERE conversion_action.status != 'REMOVED'`);

console.log('\n## Conversion actions\n');
console.log(row(['Action', 'Status', 'Type', 'Category', 'Primary', 'Counting', 'All conv. (range)']));
console.log(row(Array(7).fill('---')));
for (const r of actions) {
  const a = r.conversionAction;
  console.log(row([a.name, a.status, a.type, a.category, a.primaryForGoal ? 'yes' : 'no', a.countingType, num(r.metrics?.allConversions).toFixed(1)]));
}

const ads = await search(`
  SELECT campaign.name, ad_group.name, ad_group_ad.status, ad_group_ad.policy_summary.approval_status,
         ad_group_ad.ad.final_urls
  FROM ad_group_ad WHERE ad_group_ad.status != 'REMOVED' AND campaign.status != 'REMOVED'`);

const destinations = new Map();
const problems = [];
for (const r of ads) {
  for (const url of r.adGroupAd.ad?.finalUrls || []) destinations.set(url, (destinations.get(url) || 0) + 1);
  const approval = r.adGroupAd.policySummary?.approvalStatus;
  if (approval && approval !== 'APPROVED') problems.push(`${r.campaign.name} / ${r.adGroup.name}: ${approval}`);
}
console.log('\n## Ad destinations\n');
for (const [url, count] of [...destinations].sort()) console.log(`- ${url} (${count} ads)`);
console.log('\n## Ads not fully approved\n');
console.log(problems.length ? problems.map(p => `- ${p}`).join('\n') : 'None.');
