export const zqPrioritySuburbSlugs = [
  'glenelg',
  'norwood',
  'unley',
  'prospect',
  'mawson-lakes',
  'marion',
  'modbury',
  'henley-beach',
  'port-adelaide',
  'salisbury',
  'elizabeth',
  'gawler',
  'mitcham',
  'burnside',
  'magill',
  'campbelltown',
  'golden-grove',
  'tea-tree-gully',
  'brighton',
  'west-lakes',
  'semaphore',
  'victor-harbor',
  'mount-barker',
];

export const zqPrioritySuburbRoutes = zqPrioritySuburbSlugs.map((slug) => ({
  slug,
  output: `removalists-${slug}/index.html`,
  path: `/removalists-${slug}/`,
  pageType: 'suburb',
}));

export const zqSuburbQualityRules = {
  minimumVisibleFaqCount: 4,
  minimumInternalLinks: 6,
  requiredModules: [
    'hero-title',
    'local-intro',
    'local-service-summary',
    'logistics-access',
    'nearby-suburbs',
    'related-services',
    'suburb-faq',
    'bottom-cta',
  ],
};
