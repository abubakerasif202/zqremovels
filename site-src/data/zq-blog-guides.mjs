export const zqGuidePages = [
  {
    slug: 'how-much-do-removalists-cost-adelaide',
    title: 'How Much Do Removalists Cost Adelaide',
    topic: 'removalist cost planning',
    type: 'article',
    basePath: 'adelaide-moving-guides',
  },
  {
    slug: 'best-time-to-book-removalists-adelaide',
    title: 'Best Time to Book Removalists Adelaide',
    topic: 'booking timing',
    type: 'article',
    basePath: 'adelaide-moving-guides',
  },
  {
    slug: 'how-to-prepare-furniture-for-moving',
    title: 'How to Prepare Furniture for Moving',
    topic: 'furniture preparation',
    type: 'article',
    basePath: 'adelaide-moving-guides',
  },
  {
    slug: 'apartment-moving-tips-adelaide',
    title: 'Apartment Moving Tips Adelaide Access Guide',
    topic: 'apartment move access planning',
    type: 'article',
    basePath: 'adelaide-moving-guides',
  },
];

export const zqGuideIntentProfiles = {
  'how-much-do-removalists-cost-adelaide': {
    title: 'How Much Do Removalists Cost Adelaide',
    topic: 'removalist cost planning',
    primaryKeyword: 'how much do removalists cost Adelaide',
    searchIntent: 'pricing research before requesting a fixed-price moving quote',
    uniqueAngle: 'explains quote factors without publishing fake universal prices or invented discounts',
  },
  'best-time-to-book-removalists-adelaide': {
    title: 'Best Time to Book Removalists Adelaide',
    topic: 'booking timing',
    primaryKeyword: 'best time to book removalists Adelaide',
    searchIntent: 'booking lead-time research for local, apartment, office, and interstate moves',
    uniqueAngle: 'ties booking timing to access complexity, month-end pressure, lift windows, and crew availability',
  },
  'how-to-prepare-furniture-for-moving': {
    title: 'How to Prepare Furniture for Moving',
    topic: 'furniture preparation',
    primaryKeyword: 'how to prepare furniture for moving',
    searchIntent: 'furniture protection and move-day preparation',
    uniqueAngle: 'separates cleaning, disassembly, wrapping, measuring, and access notes before the quote is locked',
  },
  'apartment-moving-tips-adelaide': {
    title: 'Apartment Moving Tips Adelaide Access Guide',
    topic: 'apartment move access planning',
    primaryKeyword: 'apartment moving tips Adelaide',
    searchIntent: 'apartment move preparation around lifts, loading zones, stairs, and building rules',
    uniqueAngle: 'focuses on Adelaide apartment access, service-lift booking, corridor protection, and unload sequencing',
  },
};

export const zqGuideRoutes = zqGuidePages.map(({ slug, basePath }) => ({
  slug,
  output: `${basePath}/${slug}/index.html`,
  path: `/${basePath}/${slug}/`,
  pageType: 'blog',
}));
