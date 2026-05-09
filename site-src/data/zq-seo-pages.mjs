import { zqGuideRoutes } from './zq-blog-guides.mjs';
import { zqServiceSitemapOutputs } from './zq-services.mjs';
import { zqPrioritySuburbRoutes } from './zq-suburbs.mjs';

export const zqCanonicalHostPolicy = {
  siteUrl: 'https://zqremovals.au',
  note: 'Repo policy and Vercel redirects use the apex host as canonical.',
};

export const zqCoreServiceRoutes = [
  { output: 'removalists-adelaide/index.html', path: '/removalists-adelaide/', pageType: 'main' },
  { output: 'house-removals-adelaide/index.html', path: '/house-removals-adelaide/', pageType: 'service' },
  { output: 'office-removals-adelaide/index.html', path: '/office-removals-adelaide/', pageType: 'service' },
  { output: 'cheap-removalists-adelaide/index.html', path: '/cheap-removalists-adelaide/', pageType: 'service' },
  ...zqServiceSitemapOutputs.map((output) => ({
    output,
    path: `/${output.replace(/\/index\.html$/, '/')}`,
    pageType: 'service',
  })),
];

export const zqSeoRouteManifest = {
  main: zqCoreServiceRoutes.filter((route) => route.pageType === 'main'),
  services: zqCoreServiceRoutes.filter((route) => route.pageType === 'service'),
  suburbs: zqPrioritySuburbRoutes,
  guides: zqGuideRoutes,
};

export const zqExpectedGeneratedOutputs = [
  ...zqSeoRouteManifest.main.map((route) => route.output),
  ...zqSeoRouteManifest.services.map((route) => route.output),
  ...zqSeoRouteManifest.suburbs.map((route) => route.output),
  ...zqSeoRouteManifest.guides.map((route) => route.output),
];
