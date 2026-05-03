const SITE_URL = 'https://zqremovals.au';
const BUSINESS_NAME = 'ZQ Removals';
const PHONE = '+61 433 819 989';
const DEFAULT_OG_IMAGE = `${SITE_URL}/zq-removals-social-share.webp`;
const DEFAULT_LOGO = `${SITE_URL}/brand-logo.webp`;

function toAbsoluteUrl(pathname) {
  return pathname.startsWith('http') ? pathname : `${SITE_URL}${pathname}`;
}

export function normalizeInternalHref(href = '') {
  const value = String(href || '').trim();

  if (
    !value ||
    value.startsWith('#') ||
    value.startsWith('tel:') ||
    value.startsWith('mailto:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }

  if (value.startsWith('//')) {
    return value;
  }

  if (value.startsWith('/')) {
    return value.replace(/\/{2,}/g, '/');
  }

  return `/${value.replace(/^\.\/+/, '').replace(/\/{2,}/g, '/')}`;
}

export const seoConfig = {
  siteUrl: SITE_URL,
  businessName: BUSINESS_NAME,
  phone: PHONE,
  serviceAreas: ['Adelaide', 'South Australia', 'Australia'],
  socialProfiles: ['https://share.google/Y04mpt9RTflWP3iRl'],
  defaultOgImage: DEFAULT_OG_IMAGE,
  defaultLogo: DEFAULT_LOGO,
  robots: 'index,follow,max-image-preview:large',
  titleTemplate: '%s | ZQ Removals',
  titleMaxLength: 68,
  descriptionMaxLength: 160,
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'MovingCompany',
  '@id': `${SITE_URL}/#business`,
  name: BUSINESS_NAME,
  url: SITE_URL,
  telephone: PHONE,
  image: DEFAULT_OG_IMAGE,
  logo: DEFAULT_LOGO,
  hasMap: seoConfig.socialProfiles[0],
  sameAs: seoConfig.socialProfiles,
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Andrews Farm',
    addressRegion: 'SA',
    postalCode: '5114',
    addressCountry: 'AU',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: PHONE,
      areaServed: seoConfig.serviceAreas,
      availableLanguage: ['en'],
      url: `${SITE_URL}/contact-us/`,
    },
  ],
};

const interstateRouteData = [
  ['adelaide-to-melbourne-removals', 'Melbourne', 'Adelaide to Melbourne', 'approx. 730km via Western Hwy', 'A8'],
  ['adelaide-to-sydney-removals', 'Sydney', 'Adelaide to Sydney', 'approx. 1,375km via Sturt Hwy', 'M31'],
  ['adelaide-to-brisbane-removals', 'Brisbane', 'Adelaide to Brisbane', 'approx. 2,000km via Newell Hwy', 'A1'],
  ['adelaide-to-canberra-removals', 'Canberra', 'Adelaide to Canberra', 'approx. 1,160km via Sturt Hwy', 'M23'],
  ['adelaide-to-perth-removals', 'Perth', 'Adelaide to Perth', 'approx. 2,700km via Eyre Hwy', 'A1'],
];

export const imageAssets = {
  homepage: {
    path: '/media/home-local-hero-branded.webp',
    url: toAbsoluteUrl('/media/home-local-hero-branded.webp'),
    alt: 'ZQ Removals branded Adelaide moving scene with premium local coverage',
    title: 'ZQ Removals Adelaide moving service',
    caption: 'Premium Adelaide removals with clear quote-first planning.',
    width: 768,
    height: 406,
  },
  suburb: {
    path: '/media/zq-local-premium.webp',
    url: toAbsoluteUrl('/media/zq-local-premium.webp'),
    alt: 'ZQ Removals Adelaide suburb moving coverage image',
    title: 'Adelaide suburb removals',
    caption: 'Suburb-specific moving support across Adelaide.',
    width: 1200,
    height: 900,
  },
  guide: {
    path: '/media/zq-service-premium.webp',
    url: toAbsoluteUrl('/media/zq-service-premium.webp'),
    alt: 'ZQ Removals Adelaide moving guide planning image',
    title: 'Adelaide moving guide',
    caption: 'Planning resources for Adelaide removals and packing.',
    width: 1200,
    height: 900,
  },
  operations: {
    path: '/media/zq-operations-premium.webp',
    url: toAbsoluteUrl('/media/zq-operations-premium.webp'),
    alt: 'ZQ Removals commercial and operations planning image',
    title: 'Adelaide office and operations relocations',
    caption: 'Operational Adelaide moves with structured access and timing.',
    width: 1200,
    height: 900,
  },
  interstate: {
    path: '/media/zq-interstate-premium.webp',
    url: toAbsoluteUrl('/media/zq-interstate-premium.webp'),
    alt: 'ZQ Removals interstate route planning image',
    title: 'Interstate and staged Adelaide removals',
    caption: 'Longer Adelaide routes with staged delivery and route planning.',
    width: 1200,
    height: 900,
  },
};

const generatedPageImageAssignments = {
  suburb: {
    default: imageAssets.suburb,
    CBD: imageAssets.operations,
    'CBD fringe': imageAssets.operations,
    coastal: imageAssets.suburb,
    'southern coastal': imageAssets.interstate,
    southern: imageAssets.suburb,
    northern: imageAssets.homepage,
    'northern fringe': imageAssets.homepage,
    eastern: imageAssets.suburb,
    'inner east': imageAssets.suburb,
    'inner north': imageAssets.homepage,
    'inner south': imageAssets.suburb,
    'north-adelaide': imageAssets.operations,
    'north-eastern': imageAssets.homepage,
    'west-north': imageAssets.homepage,
    western: imageAssets.suburb,
    'south-west': imageAssets.operations,
    hills: imageAssets.interstate,
    'eastern hills': imageAssets.interstate,
  },
  guide: {
    default: imageAssets.guide,
  },
  commercial: {
    'cheap-removalists-adelaide': imageAssets.homepage,
    'same-day-removalists-adelaide': imageAssets.homepage,
    'last-minute-removalists-adelaide': imageAssets.homepage,
    'apartment-removalists-adelaide': imageAssets.guide,
    'office-relocation-adelaide': imageAssets.operations,
    'storage-friendly-removals-adelaide': imageAssets.interstate,
  },
};

export function mergePagesByOutput(...pageGroups) {
  const merged = new Map();
  for (const page of pageGroups.flat().filter(Boolean)) {
    merged.set(normalizePageOutput(page.output), page);
  }
  return [...merged.values()];
}

export function buildTitle(partial, variant = 'brand') {
  if (partial.includes('|')) return clampText(partial, seoConfig.titleMaxLength);
  
  const templates = {
    brand: `${partial} | ZQ Removals`,
    quote: `${partial} | Get a Fixed-Price Quote`,
    local: `${partial} | Local Adelaide Removalists`,
    interstate: `${partial} | Direct Interstate Moving`,
    urgent: `${partial} | Urgent & Last Minute Movers`,
    experts: `${partial} | Professional Local Experts`,
    fast: `${partial} | Fast Service & Clear Pricing`,
  };
  
  return clampText(templates[variant] || templates.brand, seoConfig.titleMaxLength);
}

export function buildDescription(text) {
  return clampText(text, seoConfig.descriptionMaxLength);
}

export function buildCanonical(pathname) {
  return new URL(pathname, SITE_URL).toString();
}

export function buildOGTags({ title, description, url, image = DEFAULT_OG_IMAGE, type = 'website' }) {
  return {
    ogType: type,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogImage: image,
  };
}

export function buildTwitterTags({ title, description, image = DEFAULT_OG_IMAGE }) {
  return {
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  };
}

export function buildLocalBusinessSchema() {
  return localBusinessSchema;
}

export function buildServiceSchema({ id, name, serviceType, areaServed, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${id}#service`,
    name,
    serviceType,
    provider: { '@id': `${SITE_URL}/#business` },
    areaServed,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'AUD',
      description,
    },
  };
}

export function buildBreadcrumbSchema(items, id) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${id}#breadcrumbs`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFAQSchema(items, id) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${id}#faq`,
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export function buildImageObjectSchema({ id, url, name, caption }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `${id}#image`,
    contentUrl: url,
    url,
    name,
    caption,
  };
}

export function getRouteCoverageReport() {
  return getGeneratedPages()
    .filter((page) => page.generatedKind === 'suburb')
    .map((page) => {
      const slug = page.output.replace(/^removalists-/, '').replace(/\/index\.html$/, '');
      const suburb = getSuburbData(slug);
      const clusterKey = normalizeClusterKey(suburb?.clusterKey || 'northern');
      const supportProfile = getClusterSupportProfile(clusterKey);
      const faqPool = getFaqPool(clusterKey);
      const siblings = getSuburbPeerLinks(slug, clusterKey).map((item) => item.href);
      const guideLinks = supportProfile.guides.map((item) => item.href);
      const hubPaths = supportProfile.hubs.map((item) => item.href);

      return {
        slug,
        suburb: suburb?.suburb || slug,
        region: suburb?.region || 'Adelaide',
        clusterKey,
        canonical: page.canonical,
        hubPaths,
        siblingPaths: siblings,
        guidePaths: guideLinks,
        faqTopics: faqPool.map((item) => item.question),
        traceableFrom: [
          ...hubPaths,
          ...siblings.slice(0, 3),
          ...supportProfile.services.slice(0, 2).map((item) => item.href),
        ].filter(Boolean),
      };
    });
}

export function getSuburbLinkProfile(slug) {
  const suburb = getSuburbData(slug);
  if (!suburb) {
    return null;
  }

  const clusterKey = normalizeClusterKey(suburb.clusterKey);
  const template = clusterTemplates[clusterKey] || clusterTemplates.northern;

  return {
    slug,
    suburb: suburb.suburb,
    region: suburb.region,
    clusterKey,
    peers: getSuburbPeerLinks(slug, clusterKey, template.nearby, 4),
    support: getClusterSupportProfile(clusterKey),
  };
}

export function getSuburbDataset() {
  return suburbData.map(([slug, suburb, region, clusterKey, logisticsLabel]) => ({
    slug,
    suburb,
    region,
    clusterKey,
    logisticsLabel,
  }));
}

function clampText(value, limit) {
  const text = String(value).trim().replace(/\s+/g, ' ');
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function getSuburbData(slug) {
  return suburbDataBySlug.get(slug);
}

function getFaqPool(clusterKey) {
  return faqPools[normalizeClusterKey(clusterKey)] || faqPools.northern;
}

function getSuburbStartHere(slug) {
  const profiles = {
    'adelaide-cbd': {
      eyebrow: 'When to use this page',
      heading: 'When Adelaide CBD is your move origin or destination',
      intro: 'Use this page for city jobs that require coordination with building management, lift bookings, or strict loading dock windows.',
      points: [
        'You are moving a CBD apartment or office with service lift rules',
        'Loading is restricted to specific morning or afternoon windows',
        'Concierge or building manager instructions must be followed',
      ],
    },
    'marion': {
      eyebrow: 'When to use this page',
      heading: 'When Marion is your starting point',
      intro: 'Use this page if you are moving in the Marion area and want a quote that accounts for unit access, southern corridor traffic, or larger family inventories.',
      points: [
        'You are moving to or from Marion or nearby southern suburbs',
        'The inventory includes a mix of household items and outdoor settings',
        'Access details like stairs or shared driveways need to be planned early',
      ],
    },
    'mawson-lakes': {
      eyebrow: 'When to use this page',
      heading: 'When Mawson Lakes move planning starts here',
      intro: 'Use this page for Mawson Lakes moves where multi-level stairs, tight street access, or precinct rules will shape the quote and plan.',
      points: [
        'Moving within the Mawson Lakes residential or university precinct',
        'Handling fragile or modern furniture through tighter internal layouts',
        'Requiring a fixed-price quote based on specific property access',
      ],
    },
    'elizabeth': {
      eyebrow: 'When to use this page',
      heading: 'When Elizabeth is your move origin or destination',
      intro: 'Use this page when moving in the Elizabeth area and you want a quote that reflects full household volumes, garage items, or northern access conditions.',
      points: [
        'Moving house or unit in the Elizabeth and northern region',
        'Large inventory including bulky furniture and outdoor settings',
        'Need for a reliable, fixed-price quote with no hidden extras',
      ],
    },
  };

  return profiles[slug] || {
    eyebrow: 'When to use this page',
    heading: 'When to start your move planning here',
    intro: 'Use this page as a starting point for your move research to ensure your quote reflects local access and inventory requirements.',
    points: [
      'You are moving within this suburb or the surrounding local region',
      'You want a quote based on real access conditions like stairs or parking',
      'You need a reliable, professional crew with local route expertise',
    ],
  };
}

function normalizePageOutput(output) {
  return String(output || '').replace(/\\/g, '/');
}

export function getGuideSupportProfile(guideSlug) {
  // Contextual links from guides back to money pages and relevant hubs
  const profiles = {
    'moving-checklist-adelaide': {
      services: [
        { href: '/house-removals-adelaide/', label: 'request a house removal quote' },
        { href: '/packing-services-adelaide/', label: 'packing and protection support' },
      ],
      hubs: [
        { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
        { href: '/removalists-marion/', label: 'Marion family-home planning' },
      ],
    },
    'removalist-cost-adelaide': {
      services: [
        { href: '/house-removals-adelaide/', label: 'house move fixed pricing' },
        { href: '/furniture-removalists-adelaide/', label: 'furniture moving quotes' },
        { href: '/cheap-removalists-adelaide/', label: 'budget-conscious move quotes' },
      ],
      hubs: [
        { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
        { href: '/removalists-salisbury/', label: 'Salisbury local removals' },
      ],
    },
    'packing-tips-adelaide': {
      services: [
        { href: '/packing-services-adelaide/', label: 'professional packing service' },
        { href: '/house-removals-adelaide/', label: 'house removals in Adelaide' },
      ],
      hubs: [
        { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
        { href: '/removalists-glenelg/', label: 'Glenelg apartment packing' },
      ],
    },
    'office-relocation-preparation-adelaide': {
      services: [
        { href: '/office-relocation-adelaide/', label: 'office relocation service' },
        { href: '/office-removals-adelaide/', label: 'business moving support' },
      ],
      hubs: [
        { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD office removals' },
      ],
    },
    'apartment-moving-tips-adelaide': {
      services: [
        { href: '/apartment-removalists-adelaide/', label: 'apartment removals support' },
        { href: '/packing-services-adelaide/', label: 'packing for tight spaces' },
      ],
      hubs: [
        { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD removals' },
        { href: '/removalists-glenelg/', label: 'Glenelg apartment moves' },
      ],
    },
  };

  return profiles[guideSlug] || {
    services: [
      { href: '/house-removals-adelaide/', label: 'Adelaide house removals' },
      { href: '/packing-services-adelaide/', label: 'packing and protection' },
    ],
    hubs: [{ href: '/removalists-adelaide/', label: 'Adelaide removals hub' }],
  };
}

function normalizeClusterKey(clusterKey) {
  const aliases = {
    'east hills': 'eastern hills',
    'northern growth': 'northern fringe',
  };
  return aliases[clusterKey] || clusterKey;
}

const suburbData = [
  ['adelaide-cbd', 'Adelaide CBD', 'Adelaide CBD', 'CBD', 'tower and lift planning'],
  ['north-adelaide', 'North Adelaide', 'North Adelaide', 'CBD fringe', 'heritage access and parking'],
  ['glenelg', 'Glenelg', 'Glenelg', 'coastal', 'beachside apartments, coastal parking and weekend access'],
  ['marion', 'Marion', 'Marion', 'southern', 'family homes and mixed-use access'],
  ['salisbury', 'Salisbury', 'Salisbury', 'northern', 'family homes, northern driveway access and large furniture'],
  ['elizabeth', 'Elizabeth', 'Elizabeth', 'northern', 'family-home access and staging'],
  ['elizabeth-downs', 'Elizabeth Downs', 'Elizabeth Downs', 'northern', 'larger inventory and driveway access'],
  ['elizabeth-vale', 'Elizabeth Vale', 'Elizabeth Vale', 'northern', 'unit and townhouse access'],
  ['blakeview', 'Blakeview', 'Blakeview', 'northern', 'estate homes and school-run timing'],
  ['gawler', 'Gawler', 'Gawler', 'northern fringe', 'townhouse and family-home staging'],
  ['andrews-farm', 'Andrews Farm', 'Andrews Farm', 'northern', 'new-build and estate moves'],
  ['mawson-lakes', 'Mawson Lakes', 'Mawson Lakes', 'northern', 'apartment lift and estate access'],
  ['norwood', 'Norwood', 'Norwood', 'eastern', 'terraces and mixed residential-commercial access'],
  ['reynella', 'Reynella', 'Reynella', 'southern', 'family-home and storage-linked moves'],
  ['seaford', 'Seaford', 'Seaford', 'coastal', 'coastal family-home access'],
  ['noarlunga', 'Noarlunga', 'Noarlunga', 'southern coastal', 'storage and corridor planning'],
  ['morphett-vale', 'Morphett Vale', 'Morphett Vale', 'southern', 'garage-heavy and townhouse moves'],
  ['hallett-cove', 'Hallett Cove', 'Hallett Cove', 'coastal', 'hill access and apartment moves'],
  ['glenunga', 'Glenunga', 'Glenunga', 'eastern', 'premium apartment and villa access'],
  ['burnside', 'Burnside', 'Burnside', 'eastern', 'heritage and premium home moves'],
  ['prospect', 'Prospect', 'Prospect', 'inner north', 'character homes and apartment access'],
  ['unley', 'Unley', 'Unley', 'inner south', 'townhouse and villa access'],
  ['goodwood', 'Goodwood', 'Goodwood', 'inner south', 'rail corridor and shared access'],
  ['kensington-gardens', 'Kensington Gardens', 'Kensington Gardens', 'eastern', 'family-home moves'],
  ['stepney', 'Stepney', 'Stepney', 'inner east', 'mixed-use and compact streets'],
  ['trinity-gardens', 'Trinity Gardens', 'Trinity Gardens', 'eastern', 'compact access and family homes'],
  ['fullarton', 'Fullarton', 'Fullarton', 'eastern', 'family homes and unit access'],
  ['st-peters', 'St Peters', 'St Peters', 'eastern', 'heritage and larger home inventory'],
  ['magill', 'Magill', 'Magill', 'eastern', 'family-home and university-adjacent moves'],
  ['campbelltown', 'Campbelltown', 'Campbelltown', 'eastern', 'home and unit relocations'],
  ['athelstone', 'Athelstone', 'Athelstone', 'eastern hills', 'driveway and slope access'],
  ['modbury', 'Modbury', 'Modbury', 'north-eastern', 'family homes and shopping precinct access'],
  ['munno-para', 'Munno Para', 'Munno Para', 'northern growth', 'estate homes and new-build relocations'],
  ['parafield-gardens', 'Parafield Gardens', 'Parafield Gardens', 'northern', 'family homes and wide loads'],
  ['pennington', 'Pennington', 'Pennington', 'western', 'mixed residential and industrial access'],
  ['port-adelaide', 'Port Adelaide', 'Port Adelaide', 'western', 'heritage and dockside access'],
  ['west-lakes', 'West Lakes', 'West Lakes', 'western', 'waterfront homes and unit access'],
  ['henley-beach', 'Henley Beach', 'Henley Beach', 'coastal', 'beachside apartments and homes'],
  ['grange', 'Grange', 'Grange', 'coastal', 'premium coastal homes and parking'],
  ['semaphore', 'Semaphore', 'Semaphore', 'coastal', 'beachfront apartments and tight access'],
  ['brighton', 'Brighton', 'Brighton', 'coastal', 'family homes and apartment access'],
  ['somerton-park', 'Somerton Park', 'Somerton Park', 'coastal', 'coastal villa moves'],
  ['hove', 'Hove', 'Hove', 'coastal', 'apartment and townhouse access'],
  ['seacliff', 'Seacliff', 'Seacliff', 'coastal', 'slope and coastal access'],
  ['blackwood', 'Blackwood', 'Blackwood', 'hills', 'sloped driveways and larger furniture'],
  ['belair', 'Belair', 'Belair', 'hills', 'long driveways and house moves'],
  ['woodcroft', 'Woodcroft', 'Woodcroft', 'southern', 'family homes and storage'],
  ['christies-beach', 'Christies Beach', 'Christies Beach', 'coastal', 'coastal homes and units'],
  ['port-noarlunga', 'Port Noarlunga', 'Port Noarlunga', 'coastal', 'tight beach access and apartments'],
  ['oaklands-park', 'Oaklands Park', 'Oaklands Park', 'southern', 'retail-adjacent and home moves'],
  ['edwardstown', 'Edwardstown', 'Edwardstown', 'south-west', 'mixed commercial and residential access'],
  ['melrose-park', 'Melrose Park', 'Melrose Park', 'south-west', 'family homes and offices'],
  ['findon', 'Findon', 'Findon', 'western', 'family homes and wider driveways'],
  ['seaton', 'Seaton', 'Seaton', 'western', 'coastal-adjacent homes'],
  ['fulham', 'Fulham', 'Fulham', 'western', 'family and apartment moves'],
  ['kidman-park', 'Kidman Park', 'Kidman Park', 'western', 'compact suburban access'],
  ['largs-bay', 'Largs Bay', 'Largs Bay', 'coastal', 'coastal access and parking'],
  ['new-port', 'New Port', 'New Port', 'western', 'apartment and harbour-side moves'],
  ['croydon', 'Croydon', 'Croydon', 'inner west', 'character homes and compact streets'],
  ['kilburn', 'Kilburn', 'Kilburn', 'inner north', 'light industrial and home moves'],
  ['ferryden-park', 'Ferryden Park', 'Ferryden Park', 'west-north', 'mixed-access housing'],
  ['angle-park', 'Angle Park', 'Angle Park', 'west-north', 'corridor and industrial links'],
  ['adelaide-parklands', 'Adelaide Parklands', 'Adelaide Parklands', 'CBD fringe', 'parklands and city access'],
  ['medindie', 'Medindie', 'Medindie', 'north-adelaide', 'premium homes and estate planning'],
  ['walkerville', 'Walkerville', 'Walkerville', 'north-adelaide', 'house and villa moves'],
  ['north-park', 'North Park', 'North Park', 'inner north', 'compact residential streets'],
  ['clearview', 'Clearview', 'Clearview', 'northern', 'family-home access'],
  ['windsor-gardens', 'Windsor Gardens', 'Windsor Gardens', 'north-eastern', 'family homes and river-adjacent access'],
  ['hope-valley', 'Hope Valley', 'Hope Valley', 'north-eastern', 'house and storage moves'],
  ['klemzig', 'Klemzig', 'Klemzig', 'inner east', 'mixed unit and home access'],
  ['west-croydon', 'West Croydon', 'West Croydon', 'inner west', 'compact streets and terraces'],
  ['glandore', 'Glandore', 'Glandore', 'south-west', 'home and office links'],
  ['kings-park', 'Kings Park', 'Kings Park', 'inner west', 'small blocks and townhouse access'],
  ['mitcham', 'Mitcham', 'Mitcham', 'hills', 'premium home and driveway planning'],
  ['urrbrae', 'Urrbrae', 'Urrbrae', 'east hills', 'school zone and house moves'],
  ['clarence-park', 'Clarence Park', 'Clarence Park', 'inner south', 'compact streets and villas'],
  ['west-beach', 'West Beach', 'West Beach', 'coastal', 'coastal homes and airport-side access'],
  ['torrensville', 'Torrensville', 'Torrensville', 'western', 'mixed housing and apartments'],
  ['mile-end', 'Mile End', 'Mile End', 'western', 'warehouse and home moves'],
  ['henley-beach-south', 'Henley Beach South', 'Henley Beach South', 'coastal', 'beachfront apartment moves'],
  ['albert-park', 'Albert Park', 'Albert Park', 'western', 'family homes and tighter streets'],
  ['birkenhead', 'Birkenhead', 'Birkenhead', 'western', 'port-side access'],
  ['seaton-south', 'Seaton South', 'Seaton South', 'western', 'suburban access and unit moves'],
  ['locksley', 'Locksley', 'Locksley', 'western', 'family-home access'],
  ['woodville', 'Woodville', 'Woodville', 'western', 'mixed housing and wider roads'],
  ['woodville-gardens', 'Woodville Gardens', 'Woodville Gardens', 'western', 'mixed residential access'],
  ['rosemont', 'Rosemont', 'Rosemont', 'north-adelaide', 'premium residences and careful carrying'],
  ['northfield', 'Northfield', 'Northfield', 'northern', 'family homes and garages'],
  ['field-park', 'Field Park', 'Field Park', 'southern', 'house and unit moves'],
  ['st-marys', 'St Marys', 'St Marys', 'southern', 'townhouse and apartment access'],
  ['dudley-park', 'Dudley Park', 'Dudley Park', 'western', 'mixed housing and access'],
  ['glengowrie', 'Glengowrie', 'Glengowrie', 'coastal', 'coastal townhouses and homes'],
  ['somerton-park-west', 'Somerton Park West', 'Somerton Park West', 'coastal', 'beachside streets and apartments'],
  ['victor-harbor-road', 'Victor Harbor Road Corridor', 'Victor Harbor Road Corridor', 'southern coastal', 'route planning and longer corridor moves'],
  ['yatala-vale', 'Yatala Vale', 'Yatala Vale', 'north-eastern', 'larger homes and hill-adjacent access'],
  ['linden-park', 'Linden Park', 'Linden Park', 'eastern', 'premium homes and driveways'],
  ['glen-osmond', 'Glen Osmond', 'Glen Osmond', 'east hills', 'slope and access planning'],
  ['myrtle-bank', 'Myrtle Bank', 'Myrtle Bank', 'eastern', 'family homes and quiet streets'],
  ['toorak-gardens', 'Toorak Gardens', 'Toorak Gardens', 'eastern', 'premium access and careful handling'],
  ['hyde-park', 'Hyde Park', 'Hyde Park', 'inner south', 'compact streets and premium homes'],
  ['malvern', 'Malvern', 'Malvern', 'inner south', 'villa and townhouse moves'],
  ['colonel-light-gardens', 'Colonel Light Gardens', 'Colonel Light Gardens', 'south-west', 'heritage-style homes and access'],
  ['payneham', 'Payneham', 'Payneham', 'eastern', 'family homes and units'],
  ['west-terrace', 'West Terrace', 'West Terrace', 'CBD fringe', 'city edge and mixed-use access'],
  ['south-plympton', 'South Plympton', 'South Plympton', 'south-west', 'home and townhouse access'],
  ['plympton', 'Plympton', 'Plympton', 'south-west', 'apartment and home moves'],
  ['moana', 'Moana', 'Moana', 'coastal', 'coastal family-home access'],
  ['trott-park', 'Trott Park', 'Trott Park', 'southern', 'family homes and storage'],
  ['coromandel-valley', 'Coromandel Valley', 'Coromandel Valley', 'hills', 'hillside homes and access'],
  ['fairview-park', 'Fairview Park', 'Fairview Park', 'north-eastern', 'family homes and storage'],
  ['ridgehaven', 'Ridgehaven', 'Ridgehaven', 'north-eastern', 'family and apartment moves'],
  ['valley-view', 'Valley View', 'Valley View', 'northern', 'garage-heavy and family moves'],
  ['paradise', 'Paradise', 'Paradise', 'north-eastern', 'apartment and family-home access'],
  ['hampstead-gardens', 'Hampstead Gardens', 'Hampstead Gardens', 'inner north', 'compact streets and home moves'],
  ['newton', 'Newton', 'Newton', 'eastern', 'family and townhouse access'],
  ['bridgewater', 'Bridgewater', 'Bridgewater', 'hills', 'hills access and long carry planning'],
  ['seaton-park', 'Seaton Park', 'Seaton Park', 'western', 'quiet residential moves'],
  ['allenby-gardens', 'Allenby Gardens', 'Allenby Gardens', 'western', 'family homes and units'],
  ['rosewater', 'Rosewater', 'Rosewater', 'western', 'mixed housing and access'],
  ['golden-grove', 'Golden Grove', 'Golden Grove', 'north-eastern', 'family estate and wide access'],
  ['tea-tree-gully', 'Tea Tree Gully', 'Tea Tree Gully', 'north-eastern', 'hillside and sloped driveway moves'],
  ['mount-barker', 'Mount Barker', 'Mount Barker', 'hills', 'long-distance metro and estate access'],
];

const suburbDataBySlug = new Map(
  suburbData.map(([slug, suburb, region, clusterKey, logisticsLabel]) => [
    slug,
    { slug, suburb, region, clusterKey, logisticsLabel },
  ]),
);

const suburbDataByName = new Map(
  suburbData.map(([slug, suburb, region, clusterKey, logisticsLabel]) => [
    suburb,
    { slug, suburb, region, clusterKey, logisticsLabel },
  ]),
);

const suburbsByClusterKey = suburbData.reduce((map, [slug, suburb, region, clusterKey, logisticsLabel]) => {
  const normalizedKey = normalizeClusterKey(clusterKey);
  const current = map.get(normalizedKey) || [];
  current.push({ slug, suburb, region, clusterKey: normalizedKey, logisticsLabel });
  map.set(normalizedKey, current);
  return map;
}, new Map());

const clusterTemplates = {
  CBD: {
    intro: 'City moves in {suburb} usually depend on lift windows, loading docks, parking, and the exact handover time.',
    logistics: ['service lifts', 'loading docks', 'timed parking'],
    nearby: ['Adelaide CBD', 'North Adelaide', 'West Terrace'],
  },
  coastal: {
    intro: '{suburb} moves often need coastal access planning because parking, humidity, and apartment entries can slow the day.',
    logistics: ['coastal parking', 'apartment entries', 'weather-aware wrapping'],
    nearby: ['Glenelg', 'Brighton', 'Somerton Park'],
  },
  'southern coastal': {
    intro: '{suburb} works best with a route plan that covers storage, beachside access, and the final carry path.',
    logistics: ['storage stops', 'beachside access', 'carry distance'],
    nearby: ['Noarlunga', 'Christies Beach', 'Seaford'],
  },
  southern: {
    intro: '{suburb} moves often combine family homes, garages, and townhouse access that rewards tighter sequencing.',
    logistics: ['garage-heavy loads', 'driveway setup', 'split-level homes'],
    nearby: ['Marion', 'Reynella', 'Morphett Vale'],
  },
  northern: {
    intro: '{suburb} moves usually work best when access, parking, and the room order are mapped before the truck arrives.',
    logistics: ['driveway access', 'family inventory', 'street parking'],
    nearby: ['Salisbury', 'Elizabeth', 'Blakeview'],
  },
  'northern fringe': {
    intro: '{suburb} relocations often involve bigger homes, sheds, and broader inventory than an inner-city brief.',
    logistics: ['estate homes', 'garage loads', 'larger furniture'],
    nearby: ['Gawler', 'Blakeview', 'Munno Para'],
  },
  eastern: {
    intro: '{suburb} jobs often include heritage-style homes, apartments, and premium access that need careful sequencing.',
    logistics: ['heritage access', 'apartments', 'narrow streets'],
    nearby: ['Norwood', 'Magill', 'Fullarton'],
  },
  'CBD fringe': {
    intro: '{suburb} sits close enough to the city that parking, timing, and mixed-use access can still change the quote.',
    logistics: ['city-edge parking', 'mixed-use access', 'timed loading'],
    nearby: ['Adelaide CBD', 'North Adelaide', 'West Terrace'],
  },
  'inner north': {
    intro: '{suburb} benefits from a move plan that respects character homes, tighter streets, and a stronger loading order.',
    logistics: ['character homes', 'compact streets', 'parking constraints'],
    nearby: ['Prospect', 'North Adelaide', 'Adelaide CBD'],
  },
  'inner south': {
    intro: '{suburb} moves often blend older homes, units, and tight access lanes where the sequence matters more than the distance.',
    logistics: ['older homes', 'units', 'tight lanes'],
    nearby: ['Goodwood', 'Unley', 'Melrose Park'],
  },
  'north-adelaide': {
    intro: '{suburb} usually needs heritage-aware handling, careful parking, and a clear carry path through the property.',
    logistics: ['heritage homes', 'parking control', 'carry path'],
    nearby: ['Adelaide CBD', 'Walkerville', 'Medindie'],
  },
  'north-eastern': {
    intro: '{suburb} moves often involve family homes and easier truck positioning, but inventory can still be larger than it looks.',
    logistics: ['family homes', 'longer driveways', 'garage inventory'],
    nearby: ['Modbury', 'Paradise', 'Ridgehaven'],
  },
  'west-north': {
    intro: '{suburb} sits in a practical north-west corridor where access, mixed housing, and route timing still matter.',
    logistics: ['mixed housing', 'route timing', 'access notes'],
    nearby: ['Ferryden Park', 'Angle Park', 'Rosewater'],
  },
  western: {
    intro: '{suburb} moves often benefit from a clean loading plan because homes, units, and coastal-adjacent streets can vary block by block.',
    logistics: ['varied streets', 'homes and units', 'parking pressure'],
    nearby: ['Seaton', 'Findon', 'West Lakes'],
  },
  'south-west': {
    intro: '{suburb} is best handled with a move brief that captures both household inventory and any office or commercial element.',
    logistics: ['mixed commercial access', 'townhouses', 'household inventory'],
    nearby: ['Edwardstown', 'Plympton', 'Melrose Park'],
  },
  hills: {
    intro: '{suburb} moves usually need slope-aware access planning, extra care for bulky furniture, and tighter load sequencing.',
    logistics: ['slopes', 'long driveways', 'heavy furniture'],
    nearby: ['Blackwood', 'Belair', 'Coromandel Valley'],
  },
  'eastern hills': {
    intro: '{suburb} combines eastern-suburb access with slope and driveway constraints that can change the move duration.',
    logistics: ['slope access', 'driveways', 'larger items'],
    nearby: ['Athelstone', 'Magill', 'Burnside'],
  },
  'inner east': {
    intro: '{suburb} typically suits a premium, access-aware move plan where inventory and street position both matter.',
    logistics: ['compact streets', 'premium homes', 'short carries'],
    nearby: ['Norwood', 'Fullarton', 'Stepney'],
  },
};

const faqPools = {
  CBD: [
    {
      question: 'How do CBD lift bookings affect move timing?',
      answer:
        'CBD jobs are usually timed around service-lift windows, loading access, and any required concierge coordination so the crew can work inside the building rules.',
    },
    {
      question: 'Can you handle office and apartment moves in the same CBD corridor?',
      answer:
        'Yes. CBD routes often mix apartments and offices, so the plan is built around the access type at each stop rather than treating the suburb as a generic move.',
    },
    {
      question: 'What should I confirm before a city move?',
      answer:
        'Confirm the lift booking, loading zone, entry instructions, and any time restrictions before the day so the schedule reflects the actual site access.',
    },
  ],
  coastal: [
    {
      question: 'Why do coastal suburbs need a different moving brief?',
      answer:
        'Coastal suburbs often involve parking pressure, shared entries, and more fragile handling conditions, so the move is planned around access and protection first.',
    },
    {
      question: 'Do you help with apartment and townhouse moves near the beach?',
      answer:
        'Yes. Coastal apartment and townhouse jobs are a fit when the brief includes entry points, lift access, and any long carry that could affect labour time.',
    },
    {
      question: 'Should I mention weather exposure on a coastal move?',
      answer:
        'Yes. Salt air, wind, and exposed loading can influence wrapping and staging, so it helps to mention those conditions when requesting a quote.',
    },
  ],
  'southern coastal': [
    {
      question: 'What makes southern coastal routes different from inland suburbs?',
      answer:
        'Southern coastal routes can involve longer corridor timing, storage stops, and beachside access points that affect the order of the day.',
    },
    {
      question: 'Can storage be included on the same southern coastal run?',
      answer:
        'Yes. If the route passes through storage or includes a short-term hold, the sequence can be built into the move brief from the start.',
    },
    {
      question: 'What should I tell you about access near the coast?',
      answer:
        'Tell us about parking, stairs, lift use, and carry distance so the job can be matched to the right labour and vehicle setup.',
    },
  ],
  southern: [
    {
      question: 'How do you plan family-home moves in southern Adelaide?',
      answer:
        'Southern Adelaide family-home moves are usually scoped around garages, larger furniture, and driveway setup so the load can be sequenced efficiently.',
    },
    {
      question: 'Are townhouse and split-level moves common in the south?',
      answer:
        'Yes. Those moves need clear item ordering and access notes because stairs, split levels, and mixed rooms can change the labour profile quickly.',
    },
    {
      question: 'Can packing be added to a southern Adelaide quote?',
      answer:
        'Yes. Packing is often added when the move has fragile items, mixed room contents, or a tighter delivery schedule that benefits from more preparation.',
    },
  ],
  northern: [
    {
      question: 'What should I include in a northern Adelaide move brief?',
      answer:
        'Include driveway access, street parking, garage items, and whether the property is a family home, unit, or estate-style build so the plan is realistic.',
    },
    {
      question: 'Do northern suburbs usually need bigger trucks or more labour?',
      answer:
        'Sometimes. Larger homes, garages, and estate layouts can increase load size, so the number of movers and the truck setup depend on the inventory.',
    },
    {
      question: 'Can you help with storage-linked northern moves?',
      answer:
        'Yes. Storage-linked moves are common in the north and are easier to handle when the pickup, storage stop, and final delivery are all mapped upfront.',
    },
  ],
  'northern fringe': [
    {
      question: 'Why do fringe northern suburbs need extra planning?',
      answer:
        'Fringe northern suburbs often combine larger homes, sheds, and broader loads, so the quote should reflect the full inventory and access path.',
    },
    {
      question: 'Can the route include Gawler or other outer-north stops?',
      answer:
        'Yes. Outer-north routes can be planned as a broader corridor move if the pickup, any storage stop, and the delivery order are known early.',
    },
    {
      question: 'What information helps most for a fringe suburb quote?',
      answer:
        'Share item volume, driveway width, distance to the truck, and whether any bulky furniture or shed items need extra handling.',
    },
  ],
  eastern: [
    {
      question: 'What is the main risk in eastern Adelaide moves?',
      answer:
        'Eastern moves often hinge on access detail such as heritage entries, narrow streets, and apartment coordination rather than travel distance.',
    },
    {
      question: 'Do eastern suburbs usually suit premium handling?',
      answer:
        'Yes. Many eastern jobs include better-finished homes and tighter stair or corridor handling, so the move brief should reflect that care level.',
    },
    {
      question: 'Should I mention large furniture for eastern suburbs?',
      answer:
        'Yes. Large furniture, fragile pieces, and tight internal routes can change the labour and protection plan more than the postcode itself.',
    },
  ],
  'CBD fringe': [
    {
      question: 'How is CBD-fringe access different from the city centre?',
      answer:
        'CBD-fringe jobs can still have parking limits, mixed-use entries, and time windows that need to be confirmed even when the route is not fully central.',
    },
    {
      question: 'Do fringe routes often link to offices or apartments?',
      answer:
        'Yes. Fringe routes frequently combine apartments, smaller commercial spaces, and residential streets, so the page is built around mixed access conditions.',
    },
    {
      question: 'Can I use a CBD-fringe page for a staged move?',
      answer:
        'Yes. It works well when the brief needs partial delivery, an office element, or a city-edge quote that depends on access and timing.',
    },
  ],
  'inner north': [
    {
      question: 'Why do inner-north suburbs need compact-street planning?',
      answer:
        'Inner-north streets can be narrow, parking-sensitive, and character-home heavy, so the crew benefits from a clearer loading order and timing note.',
    },
    {
      question: 'Are terraces and apartments both common in the inner north?',
      answer:
        'Yes. Mixed housing is common, which is why the suburb brief should include stairs, corridor widths, and any larger furniture items early.',
    },
    {
      question: 'Can inner-north moves link back to the Adelaide hub?',
      answer:
        'Yes. Inner-north pages should still connect to the broader Adelaide removals hub and the supporting planning guides for better route coverage.',
    },
  ],
  'inner south': [
    {
      question: 'What should be checked for inner-south access?',
      answer:
        'Check stairs, lane width, parking pressure, and whether the property is a villa, townhouse, or older home before the move date.',
    },
    {
      question: 'Do inner-south jobs often include smaller access points?',
      answer:
        'Yes. Inner-south moves frequently need more careful sequencing because the distance to the truck can matter almost as much as the suburb itself.',
    },
    {
      question: 'Is packing useful for inner-south home moves?',
      answer:
        'Often yes. Packing can reduce damage risk and help the team move through tight access points more cleanly on the day.',
    },
  ],
  'north-adelaide': [
    {
      question: 'What should I confirm for North Adelaide heritage moves?',
      answer:
        'Confirm parking control, entry width, and the carry path so heritage properties can be moved without delays or avoidable handling issues.',
    },
    {
      question: 'Do North Adelaide jobs suit careful premium handling?',
      answer:
        'Yes. The area often needs a more deliberate plan because the properties, streets, and parking conditions reward precise sequencing.',
    },
    {
      question: 'Can North Adelaide quotes include nearby city routes?',
      answer:
        'Yes. North Adelaide can be quoted with CBD or fringe routes when the move includes city access, apartments, or office-adjacent stops.',
    },
  ],
  'north-eastern': [
    {
      question: 'What do north-eastern suburbs need most from a move brief?',
      answer:
        'They usually need driveway access, garage inventory, and family-home item counts so the truck and labour plan are aligned before booking.',
    },
    {
      question: 'Are storage and family-home moves both common in the north-east?',
      answer:
        'Yes. North-eastern suburbs often mix storage stops, family homes, and larger furniture, which makes the route plan more important than a generic quote.',
    },
    {
      question: 'Should I mention driveway length in the north-east?',
      answer:
        'Yes. Longer driveways can change carry time and labour, so they are worth mentioning whenever you request a north-eastern suburb quote.',
    },
  ],
  'west-north': [
    {
      question: 'What stands out about west-north move planning?',
      answer:
        'West-north routes often combine residential streets with mixed-use or corridor traffic, so timing and access notes help keep the quote accurate.',
    },
    {
      question: 'Do west-north suburbs need parking checks?',
      answer:
        'Usually yes. Parking can be the main variable because many west-north suburbs mix homes, light industrial areas, and broader street layouts.',
    },
    {
      question: 'Can I use the west-north cluster for a broader northern job?',
      answer:
        'Yes. It works as a planning cluster when the route touches multiple nearby suburbs and the access profile is similar across the stops.',
    },
  ],
  western: [
    {
      question: 'Why do western suburbs need a separate access cluster?',
      answer:
        'Western suburbs often combine homes, units, and coastal-adjacent streets, so the job can change quickly depending on the exact street and frontage.',
    },
    {
      question: 'Do western pages support both family homes and apartments?',
      answer:
        'Yes. The western cluster is designed to cover both household and apartment-style access so the content stays relevant to the actual move.',
    },
    {
      question: 'Can I link western suburb pages back to Adelaide removals?',
      answer:
        'Yes. Western pages should still route back to the Adelaide removals hub, sibling suburbs, and the matching planning guides.',
    },
  ],
  'south-west': [
    {
      question: 'What should be captured for a south-west Adelaide move?',
      answer:
        'Capture whether the job is residential, commercial, or mixed-use, because the south-west corridor often blends those move types.',
    },
    {
      question: 'Do Plympton and Edwardstown style jobs need special planning?',
      answer:
        'Yes. South-west jobs can shift from homes to offices or mixed-use properties, so the quote should reflect the whole access profile.',
    },
    {
      question: 'Can the south-west cluster support office relocations?',
      answer:
        'Yes. The cluster is useful when the route includes office prep, mixed inventory, or a local commercial component that affects timing.',
    },
  ],
  hills: [
    {
      question: 'Why do hills suburbs need slope-aware planning?',
      answer:
        'Hills suburbs often involve driveways, slopes, and longer carries, so the move is planned around access and item handling rather than distance alone.',
    },
    {
      question: 'Should I mention heavy furniture for hills suburbs?',
      answer:
        'Yes. Heavy furniture and awkward access can change the labour requirements significantly on hills moves.',
    },
    {
      question: 'Can hills pages link to packing and damage-prevention guides?',
      answer:
        'Yes. Hills routes benefit from support guides that cover wrapping, loading order, and how to reduce risk on steep access.',
    },
  ],
  'eastern hills': [
    {
      question: 'How are eastern-hills moves different from flat eastern suburbs?',
      answer:
        'Eastern-hills moves add slope, driveway, and carry-distance variables, so the quote needs more access detail than a standard eastern route.',
    },
    {
      question: 'Do I need to mention larger furniture for the hills?',
      answer:
        'Yes. Larger pieces can be harder to manage on sloped or angled access, so they should be listed up front.',
    },
    {
      question: 'Can eastern-hills moves still link into the Adelaide hub?',
      answer:
        'Yes. They should still flow back into the Adelaide hub and the planning guides for suburb-to-suburb discoverability.',
    },
  ],
  'inner east': [
    {
      question: 'What should be included for an inner-east quote?',
      answer:
        'Include parking, carry distance, item fragility, and any premium-handling concerns so the brief reflects the actual job size.',
    },
    {
      question: 'Do inner-east moves often need careful furniture placement?',
      answer:
        'Yes. Inner-east moves usually benefit from more deliberate placement because homes, units, and street access can be tighter.',
    },
    {
      question: 'Can inner-east pages support related guide links?',
      answer:
        'Yes. They should link to planning and packing guides that help convert the suburb visit into a booking-ready enquiry.',
    },
  ],
};

const seoV5GuideProfiles = {
  'moving-cost-adelaide-2026': {
    title: 'Moving Cost Adelaide 2026',
    topic: 'moving cost Adelaide 2026',
    primaryKeyword: 'moving cost Adelaide 2026',
    searchIntent: 'pricing education before requesting a removalist quote',
    uniqueAngle: 'explains the quote factors that change the final scope without inventing fixed public prices',
  },
  'how-to-choose-removalists-adelaide': {
    title: 'How to Choose Removalists Adelaide',
    topic: 'choosing Adelaide removalists',
    primaryKeyword: 'how to choose removalists Adelaide',
    searchIntent: 'comparison research before selecting a removalist',
    uniqueAngle: 'focuses on access review, inventory clarity, written scope, and practical service fit',
  },
  'fixed-price-vs-hourly-removalists-adelaide': {
    title: 'Fixed Price vs Hourly Removalists Adelaide',
    topic: 'fixed price versus hourly removalists',
    primaryKeyword: 'fixed price vs hourly removalists Adelaide',
    searchIntent: 'quote model comparison',
    uniqueAngle: 'compares pricing risk when traffic, lifts, stairs, parking, or extra inventory change the day',
  },
  'apartment-moving-checklist-adelaide': {
    title: 'Apartment Moving Checklist Adelaide',
    topic: 'apartment moving checklist',
    primaryKeyword: 'apartment moving checklist Adelaide',
    searchIntent: 'apartment move preparation',
    uniqueAngle: 'turns lift bookings, loading zones, strata rules, and corridor protection into a quote-ready checklist',
  },
  'packing-fragile-items-adelaide': {
    title: 'Packing Fragile Items Adelaide',
    topic: 'packing fragile items',
    primaryKeyword: 'packing fragile items Adelaide',
    searchIntent: 'fragile packing preparation',
    uniqueAngle: 'separates fragile item categories, wrapping needs, carton quality, and load-order risks',
  },
  'last-minute-moving-adelaide': {
    title: 'Last Minute Moving Adelaide',
    topic: 'last minute moving',
    primaryKeyword: 'last minute moving Adelaide',
    searchIntent: 'urgent moving preparation',
    uniqueAngle: 'keeps short-notice bookings factual by tying availability to route, access, inventory, and crew schedule',
  },
  'removalist-quote-checklist-adelaide': {
    title: 'Removalist Quote Checklist Adelaide',
    topic: 'removalist quote checklist',
    primaryKeyword: 'removalist quote checklist Adelaide',
    searchIntent: 'quote request preparation',
    uniqueAngle: 'lists the exact route, access, inventory, timing, and packing details that improve quote accuracy',
  },
};

const guideTopics = [
  ['moving-checklist-adelaide', 'Moving checklist Adelaide', 'moving checklist', 'article'],
  ['removalist-cost-adelaide', 'Removalist cost Adelaide', 'cost guide', 'article'],
  ['how-to-get-accurate-removalist-quotes-adelaide', 'How to Get Accurate Removalist Quotes Adelaide', 'accurate moving quotes', 'article'],
  ['cheap-vs-fixed-price-removalists-adelaide', 'Cheap vs Fixed Price Removalists Adelaide', 'cheap vs fixed price removals', 'article'],
  ['apartment-moving-tips-adelaide', 'Apartment moving tips Adelaide', 'apartment moves', 'article'],
  ['storage-planning-adelaide', 'Storage planning Adelaide', 'storage planning', 'article'],
  ['office-relocation-preparation-adelaide', 'Office relocation preparation Adelaide', 'office preparation', 'article'],
  ['packing-tips-adelaide', 'Packing tips Adelaide', 'packing tips', 'article'],
  ['booking-timing-guide-adelaide', 'Booking timing guide Adelaide', 'booking timing', 'article'],
  ['suburb-move-preparation-adelaide', 'Suburb move preparation Adelaide', 'suburb move prep', 'article'],
  ['removalist-cost-breakdown-adelaide', 'Removalist cost breakdown Adelaide', 'cost breakdown', 'article'],
  ['how-much-do-movers-cost-adelaide', 'How much do movers cost Adelaide', 'mover pricing', 'article'],
  ['cheap-vs-professional-removalists-adelaide', 'Cheap vs professional removalists Adelaide', 'value comparison', 'article'],
  ['hourly-vs-fixed-price-movers-adelaide', 'Hourly vs fixed price movers Adelaide', 'pricing models', 'article'],
  ['moving-house-checklist-adelaide', 'Moving house checklist Adelaide', 'house checklist', 'article'],
  ['last-minute-movers-adelaide-guide', 'Last minute movers Adelaide guide', 'urgent moves', 'article'],
  ['moving-with-stairs-adelaide', 'Moving with stairs Adelaide', 'stairs access', 'article'],
  ['office-relocation-checklist-adelaide-guide', 'Office relocation checklist Adelaide guide', 'office checklist', 'article'],
  ['apartment-loading-zone-guide-adelaide', 'Apartment loading zone guide Adelaide', 'apartment loading zones', 'article'],
  ['furniture-protection-guide-adelaide', 'Furniture protection guide Adelaide', 'furniture protection', 'article'],
  ['packing-timeline-adelaide', 'Packing timeline Adelaide', 'packing timeline', 'article'],
  ['moving-heavy-items-adelaide-guide', 'Moving heavy items Adelaide guide', 'heavy item planning', 'article'],
  ['downsizing-move-adelaide', 'Downsizing move Adelaide', 'downsizing moves', 'article'],
  ['storage-unit-move-adelaide', 'Storage unit move Adelaide', 'storage unit moves', 'article'],
  ['moving-with-kids-adelaide', 'Moving with kids Adelaide', 'family move planning', 'article'],
  ['moving-fragile-items-adelaide', 'Moving fragile items Adelaide', 'fragile item planning', 'article'],
  ['end-of-lease-moving-adelaide', 'End of lease moving Adelaide', 'end of lease moves', 'article'],
  ['settlement-day-moving-adelaide', 'Settlement day moving Adelaide', 'settlement day moves', 'article'],
  ['weekend-vs-weekday-moving-adelaide', 'Weekend vs weekday moving Adelaide', 'move timing comparison', 'article'],
  ['interstate-removal-checklist-adelaide-guide', 'Interstate removal checklist Adelaide guide', 'interstate checklist', 'article'],
  ['small-office-move-adelaide', 'Small office move Adelaide', 'small office moves', 'article'],
  ['coastal-suburb-moving-adelaide', 'Coastal suburb moving Adelaide', 'coastal suburb moves', 'article'],
  ['northern-suburbs-moving-adelaide', 'Northern suburbs moving Adelaide', 'northern suburb moves', 'article'],
  ['southern-suburbs-moving-adelaide', 'Southern suburbs moving Adelaide', 'southern suburb moves', 'article'],
  ...Object.entries(seoV5GuideProfiles).map(([slug, profile]) => [
    slug,
    profile.title,
    profile.topic,
    'article',
  ]),
];

const commercialPages = [
  {
    slug: 'cheap-removalists-adelaide',
    title: 'Cheap Removalists Adelaide | Fixed-Price Moves | ZQ Removals',
    description:
      'Looking for cheap removalists in Adelaide without risky service? ZQ Removals offers affordable fixed-price moving options with careful handling and clear quotes.',
    canonical: '/cheap-removalists-adelaide/',
    type: 'money',
    hero: 'Affordable pricing works best when access, inventory, and timing are scoped clearly before the truck is booked.',
    sections: [
      'Cheap does not need to mean careless. The best low-cost Adelaide move is one where the brief is precise enough to avoid rework, waiting time, and last-minute scope changes.',
      'This page supports budget-conscious clients who still need a premium service standard, careful handling, and a clean move-day plan that avoids hidden extras.',
    ],
    faq: [
      {
        question: 'How much do cheap removalists cost in Adelaide?',
        answer: 'The final cost depends on inventory, access, stairs or lifts, distance, packing, timing, and heavy items. ZQ Removals does not publish unconfirmed prices; we provide a fixed-price quote after reviewing the move brief.',
      },
      {
        question: 'How do I keep an Adelaide move affordable?',
        answer: 'Provide an accurate inventory, clear access notes, and any packing requirements so the quote reflects the real job rather than a padded guess.',
      },
      {
        question: 'Is the cheapest quote always the best value?',
        answer: 'Not necessarily. Transparent labour time, included travel, and damage prevention usually matter more than the lowest headline price.',
      },
      {
        question: 'Can cheap removalists still handle furniture carefully?',
        answer: 'Yes. The affordable path should come from a clear scope and efficient planning, not from rushed handling or weak protection.',
      },
      {
        question: 'Can I get a fixed-price quote for a budget move?',
        answer: 'Yes. Send the route, inventory, property access, and date so the move can be quoted as an affordable fixed-price option.',
      },
    ],
  },
  {
    slug: 'affordable-removalists-adelaide',
    title: 'Affordable Removalists Adelaide | Fixed-Price Movers | ZQ Removals',
    description:
      'Affordable Adelaide removalists for house, furniture, apartment and office moves with fixed-price options, careful handling and clear quoting.',
    canonical: '/affordable-removalists-adelaide/',
    type: 'money',
    hero: 'Affordable moving should still feel organised, careful, and predictable. We scope Adelaide moves around access, inventory, timing, and handling so the quote is clear before move day.',
    sections: [
      'Affordable removalists Adelaide searches often come from people who want price control without taking a risk on careless operators. ZQ Removals keeps the premium service standard while building the quote around the details that can reduce waste.',
      'A fixed-price option can be safer than a vague hourly estimate because it forces the move brief to be reviewed upfront: truck access, stairs, lifts, item list, packing, and timing windows all sit inside the quote conversation.',
    ],
    faq: [
      { question: 'What makes a removalist affordable without lowering quality?', answer: 'A clear inventory, realistic access notes, efficient loading order, and a fixed quote can reduce uncertainty while preserving careful handling.' },
      { question: 'Do affordable removalists Adelaide include furniture handling?', answer: 'Yes. Furniture handling should be scoped into the quote, especially for bulky, fragile, antique, or apartment-access pieces.' },
      { question: 'Can I get an affordable fixed-price quote?', answer: 'Yes. Submit the pickup suburb, delivery suburb, move date, property type, access notes, and key inventory for a fixed-price review.' },
      { question: 'What affects an affordable Adelaide moving quote?', answer: 'Truck size, number of movers, stairs, lifts, distance, packing, heavy items, weekend timing, after-hours access, and parking all influence the quote.' },
      { question: 'Do you service suburbs outside central Adelaide?', answer: 'Yes. ZQ Removals services Adelaide CBD, northern, southern, coastal, eastern, and western suburbs subject to route and schedule.' },
    ],
  },
  {
    slug: 'removalist-cost-adelaide',
    title: 'Removalist Cost Adelaide | Moving Quote Guide | ZQ Removals',
    description:
      'Understand removalist cost in Adelaide, what affects your quote, and how fixed-price moving can help avoid hourly surprises.',
    canonical: '/removalist-cost-adelaide/',
    type: 'money',
    hero: 'Removalist cost in Adelaide depends on the real move brief: access, inventory, truck size, labour, distance, packing, timing, and any heavy or fragile items.',
    sections: [
      'No useful Adelaide removalist cost page should pretend every move has the same price. A small unit with lift access, a family home with garage stock, and an office move with after-hours dock access all need different labour and timing assumptions.',
      'ZQ Removals uses fixed-price quote positioning to reduce hourly surprises. The aim is to review the details first, then provide a clear quote that reflects the actual route and handling requirements.',
    ],
    faq: [
      { question: 'How much does a removalist cost in Adelaide?', answer: 'The cost depends on truck size, number of movers, access, stairs, lifts, distance, packing, heavy items, and timing. We do not invent exact prices online; we quote after reviewing your move.' },
      { question: 'Is hourly or fixed-price moving safer?', answer: 'A fixed-price quote can be safer when the scope is clear because it reduces the risk of traffic, access delays, or slow loading changing the final bill.' },
      { question: 'What affects my moving quote most?', answer: 'Inventory volume, property access, stairs or lifts, truck parking, distance, packing needs, heavy items, and weekend or after-hours requirements usually have the biggest impact.' },
      { question: 'Can packing change the removalist cost?', answer: 'Yes. Packing materials, fragile wrapping, full-home packing, and unpacking support all affect labour and preparation time.' },
      { question: 'How do I get a more accurate quote?', answer: 'Send photos or a detailed list of large items, room count, stairs, lift details, parking notes, date, and both suburbs.' },
    ],
  },
  {
    slug: 'moving-quotes-adelaide',
    title: 'Moving Quotes Adelaide | Free Fixed-Price Quote | ZQ Removals',
    description:
      'Request a moving quote in Adelaide for house, furniture, office, apartment and same-day moves. Clear fixed-price options from ZQ Removals.',
    canonical: '/moving-quotes-adelaide/',
    type: 'money',
    hero: 'A useful Adelaide moving quote starts with the details that change the job: route, inventory, access, timing, packing, and the level of furniture protection needed.',
    sections: [
      'Moving quotes Adelaide searches are usually quote-ready. The strongest quote request gives enough information to avoid a vague estimate and turn the enquiry into a practical fixed-price option.',
      'ZQ Removals keeps the quote path simple: call for urgent bookings or send the form with pickup and delivery suburbs, property types, item list, preferred date, and any access notes.',
    ],
    faq: [
      { question: 'How do I request a moving quote in Adelaide?', answer: 'Call 0433 819 989 or use the quote form with your route, property type, date, item list, and access notes.' },
      { question: 'What should I include in a moving quote request?', answer: 'Include pickup and delivery suburbs, stairs, lifts, parking, truck access, room count, heavy items, fragile pieces, packing needs, and timing constraints.' },
      { question: 'Can I get a fixed-price moving quote?', answer: 'Yes. ZQ Removals provides fixed-price quote options after reviewing the move details.' },
      { question: 'Do you quote furniture-only moves?', answer: 'Yes. Furniture-only quotes should include item dimensions, stairs or lift access, parking, and whether pieces need wrapping.' },
      { question: 'Is calling faster than the quote form?', answer: 'For same-day or urgent moves, calling is usually fastest. The form is useful when you can provide a detailed written brief.' },
    ],
  },
  {
    slug: 'same-day-removalists-adelaide',
    title: 'Same Day Removalists Adelaide | Urgent & Emergency Movers',
    description:
      'Searching for same day removalists Adelaide? ZQ Removals provides urgent moving support for homes and apartments. Fast response subject to schedule availability.',
    canonical: '/same-day-removalists-adelaide/',
    type: 'money',
    hero: 'Urgent moves need a fast but controlled response. Availability for same-day removals depends on our daily schedule and the specific requirements of your move brief.',
    sections: [
      'Same-day Adelaide removals are designed for high-urgency relocations, whether triggered by settlement changes or emergency property issues. We prioritise clear communication and fast scoping to see if we can help immediately.',
      'Our ability to support same-day bookings depends on current crew locations and job complexity. We review your access and inventory details instantly to confirm if we can allocate a professional team to your route.',
    ],
    faq: [
      {
        question: 'Do you guarantee same-day availability?',
        answer:
          'No. Availability depends on our current schedule and the scale of your move. We recommend calling us as early as possible for the best chance of securing a same-day booking.',
      },
      {
        question: 'What is the fastest way to get a same-day quote?',
        answer:
          'Call us directly or submit your move brief with full details including pickup and delivery suburbs, property types, and a list of any heavy or bulky items.',
      },
    ],
  },
  {
    slug: 'last-minute-removalists-adelaide',
    title: 'Last Minute Removalists Adelaide',
    description:
      'Last-minute Adelaide removalists for short-notice bookings that still need a stable plan, careful handling, and direct communication.',
    canonical: '/last-minute-removalists-adelaide/',
    type: 'money',
    hero: 'Last-minute bookings still need a proper plan. The quickest way to move well is to supply access, inventory, and timing details early.',
    sections: [
      'Last-minute work often means the booking window is small, so the quoting process has to be efficient and factual.',
      'This page helps capture urgent search intent while still supporting a premium brand impression and a sensible quote path.',
    ],
    faq: [
      {
        question: 'Do last-minute removalists cost more?',
        answer: 'Sometimes, depending on labour availability, timing, and the complexity of the route. Clear scoping reduces surprises.',
      },
      {
        question: 'What information do you need fastest?',
        answer: 'The addresses, move date, inventory type, access notes, and whether you need packing or heavy-item handling.',
      },
    ],
  },
  {
    slug: 'apartment-removalists-adelaide',
    title: 'Apartment Removalists Adelaide | Unit & High-Rise Moving',
    description:
      'Apartment removalists Adelaide for units, towers and townhouses. Lift bookings, loading zones, careful furniture handling and fixed-price quotes.',
    canonical: '/apartment-removalists-adelaide/',
    type: 'money',
    hero: 'Apartment removals in Adelaide require specialized planning for service lift bookings, loading zone access, and shared corridor sequencing.',
    sections: [
      'Moving into or out of an Adelaide apartment (like those in the CBD, Glenelg, Norwood, or Mawson Lakes) means managing building management rules and tight parking windows.',
      'We plan for the specific logistics of high-rise and unit living, including stair carries and long corridors, ensuring your furniture is protected and shared spaces are respected.',
    ],
    faq: [
      {
        question: 'How do I book a lift for my apartment move?',
        answer:
          'Contact your building manager or strata company as early as possible to reserve a dedicated time slot for the service lift, as these are often booked weeks in advance.',
      },
      {
        question: 'Do you handle moves in North Adelaide and Norwood apartments?',
        answer:
          'Yes. We are highly experienced with the specific access challenges of Adelaide’s inner-east and northern apartment clusters, including narrow entries and stairwells.',
      },
    ],
  },
  {
    slug: 'office-relocation-adelaide',
    title: 'Office Relocation Adelaide',
    description:
      'Office relocation services in Adelaide for businesses that need downtime control, access planning, and a staged reset.',
    canonical: '/office-relocation-adelaide/',
    type: 'money',
    hero: 'Office relocations work best when desk reset, IT equipment, dock access, and staff communication are scoped together.',
    sections: [
      'Office moves require more than a truck. They need an operational brief that covers downtime, restart order, and access to the building at both ends.',
      'This page strengthens commercial intent around office relocation while keeping the site architecture focused on quote-ready planning.',
    ],
    faq: [
      {
        question: 'What matters most in an office relocation?',
        answer: 'Downtime, access, IT handling, and a clear reset order for staff and equipment.',
      },
      {
        question: 'Can office moves be staged after hours?',
        answer: 'Often yes, subject to building access and timing constraints.',
      },
    ],
  },
  {
    slug: 'storage-friendly-removals-adelaide',
    title: 'Storage Friendly Removals Adelaide',
    description:
      'Storage-friendly Adelaide removals for moves that include a storage stop, staged delivery, or a split handover plan.',
    canonical: '/storage-friendly-removals-adelaide/',
    type: 'money',
    hero: 'Storage-friendly moves need an order of operations that handles pickup, storage, and delivery without double handling.',
    sections: [
      'Storage-friendly removals are valuable for renovations, settlement gaps, downsizing, and interstate handovers that need staging.',
      'The page supports searchers who are planning a split move and need a clearer route to storage-aware quoting.',
    ],
    faq: [
      {
        question: 'Can storage be part of the same move?',
        answer: 'Yes. The route can be scoped as pickup, storage stop, and final delivery when that is the most practical plan.',
      },
      {
        question: 'What makes storage moves more complex?',
        answer: 'Extra handling, longer timing windows, and the need to sequence the load so it can be delivered in stages.',
      },
    ],
  },
  {
    slug: 'urgent-movers-adelaide',
    title: 'Urgent Movers Adelaide',
    description:
      'Urgent movers in Adelaide for fast-response relocations. Professional handling, clear fixed pricing, and experienced crews for short-notice moves.',
    canonical: '/urgent-movers-adelaide/',
    type: 'money',
    hero: 'Urgent moves need a fast but disciplined response. We plan the route and access first to ensure a smooth, safe relocation on short notice.',
    sections: [
      'Urgent moving requirements usually come from settlement changes or unexpected property issues. The best way to move quickly is to supply a clear inventory and access brief early.',
      'This page connects high-urgency searchers with a premium-standard Adelaide removalist team that prioritises clear communication and reliable move-day timing.',
    ],
    faq: [
      {
        question: 'How quickly can urgent movers start?',
        answer: 'Depending on availability and the move brief, we can often respond within 24-48 hours. Provide your addresses and inventory early for the fastest confirmation.',
      },
      {
        question: 'What do urgent movers need to know first?',
        answer: 'We need the pickup and delivery addresses, property types (e.g., apartment vs house), and a summary of larger furniture items to allocate the right crew.',
      },
    ],
  },
  {
    slug: 'last-minute-movers-adelaide',
    title: 'Last Minute Movers Adelaide',
    description:
      'Last-minute movers in Adelaide for immediate relocation needs. Get a fixed-price quote and a professional plan for your short-notice Adelaide move.',
    canonical: '/last-minute-movers-adelaide/',
    type: 'money',
    hero: 'Last-minute move planning starts with access and inventory. We provide clear pricing and a stable plan even when the booking window is tight.',
    sections: [
      'Moving at the last minute often feels chaotic, but the operational plan stays the same: protect the furniture, sequence the load, and plan the route.',
      'We support Adelaide customers who need a professional standard and careful handling on short notice, avoiding the risks of rushed or unvetted operators.',
    ],
    faq: [
      {
        question: 'Can you handle last-minute apartment moves?',
        answer: 'Yes, provided the building lift and loading dock windows are confirmed. Coordination with building management is essential for short-notice city moves.',
      },
      {
        question: 'Are last-minute move quotes fixed?',
        answer: 'Yes. Once we have your inventory and access details, we provide a fixed-price quote so there are no surprises on move day.',
      },
    ],
  },
  {
    slug: 'fixed-price-removalists-adelaide',
    title: 'Fixed-Price Removalists Adelaide | Clear Quotes | ZQ Removals',
    description:
      'Searching for fixed price removalists Adelaide? ZQ Removals offers upfront, guaranteed pricing with no hidden hourly surprises for house, office, and apartment moves.',
    canonical: '/fixed-price-removalists-adelaide/',
    type: 'money',
    hero: 'Fixed-price moving eliminates the uncertainty of hourly rates. We provide a single, guaranteed price based on your specific move brief.',
    sections: [
      'Hourly rates can lead to "slow-walking" or unexpected costs if the truck gets stuck in Adelaide traffic or the lift is busy. Our fixed-price model means the price we quote is the price you pay, regardless of how long the day takes.',
      'We review every brief properly—including stairs, parking, and furniture inventory—so we can commit to a price that stays stable from the first box to the last.',
    ],
    faq: [
      {
        question: 'How do you calculate a fixed price?',
        answer:
          'We review your pickup and drop-off suburbs, property types, access details (like stairs or lifts), and your inventory to calculate the total work required.',
      },
      {
        question: 'Are there any hidden fees in your fixed quote?',
        answer:
          'No. Our fixed-price quotes include travel, fuel, insurance, and equipment. As long as the inventory and access match the brief, the price is guaranteed.',
      },
      {
        question: 'Why can fixed-price removals suit Adelaide moves?',
        answer:
          'Fixed pricing helps when traffic, parking, stairs, lifts, or loading windows could otherwise turn an hourly estimate into a moving target.',
      },
      {
        question: 'What details do you need for a fixed-price quote?',
        answer:
          'Pickup and delivery suburbs, property type, access notes, item list, date, packing needs, and any heavy or fragile items.',
      },
    ],
  },
  {
    slug: 'budget-removalists-adelaide',
    title: 'Budget Removalists Adelaide | Fixed-Price Movers | ZQ Removals',
    description:
      'Budget removalists Adelaide for customers who want affordable fixed-price moving options, careful furniture handling and clear scope before booking.',
    canonical: '/budget-removalists-adelaide/',
    type: 'money',
    hero: 'Budget removalists should still protect the furniture, communicate clearly, and quote from a proper move brief rather than a vague low headline rate.',
    sections: [
      'Budget-conscious Adelaide moves work best when unnecessary uncertainty is removed. That means listing the main furniture, explaining access, noting stairs or lifts, and flagging anything heavy or fragile before the quote is approved.',
      'ZQ Removals keeps budget positioning inside a premium standard: affordable fixed-price options, careful loading, clear inclusions, and a direct path to call or request a quote.',
    ],
    faq: [
      { question: 'Are budget removalists lower quality?', answer: 'They should not be. A budget-friendly move should come from efficient scoping, not poor handling or unclear inclusions.' },
      { question: 'Can I get a budget quote for a house move?', answer: 'Yes. Send the room count, large furniture list, access notes, and date so the team can review the most efficient fixed-price option.' },
      { question: 'What makes budget moving more expensive?', answer: 'Unlisted heavy items, stairs, long carries, poor parking, extra packing, after-hours timing, and unclear inventory can increase the work required.' },
      { question: 'Do budget removalists move apartments?', answer: 'Yes, provided lift bookings, loading zones, stairs, and corridor access are included in the quote brief.' },
      { question: 'How do I avoid surprise costs?', answer: 'Use a fixed-price quote and provide accurate access, inventory, packing, and timing details before booking.' },
    ],
  },
  {
    slug: 'cheap-vs-fixed-price-removalists-adelaide',
    title: 'Cheap vs Fixed Price Removalists Adelaide | Value Comparison',
    description:
      'Compare cheap removalists Adelaide vs fixed-price movers. Learn why the cheapest hourly rate can become expensive and how to find the best value for your move.',
    canonical: '/cheap-vs-fixed-price-removalists-adelaide/',
    type: 'money',
    hero: 'Choosing between a cheap hourly rate and a fixed-price quote? Understand the hidden costs of "budget" movers and how to ensure your move stays on budget.',
    sections: [
      'A low hourly rate often masks the true cost of an Adelaide move. If a team lacks experience or equipment, a "cheap" job can take twice as long, ending up more expensive than a professional fixed-price quote.',
      'ZQ Removals positions itself as the best value Adelaide removalist. By planning the move properly and committing to a fixed price, we give you cost control and a higher standard of care.',
    ],
    faq: [
      {
        question: 'Why is fixed-price better than cheap hourly rates?',
        answer:
          'Fixed-price quotes remove the risk of "slow-moving" crews or traffic delays increasing your bill. You get a guaranteed price up front.',
      },
      {
        question: 'What are the hidden costs of cheap movers?',
        answer:
          'Common hidden costs include depot-to-depot travel fees, fuel surcharges, stairs fees, and lack of transit insurance coverage.',
      },
    ],
  },
];

const seoV5DefaultServiceLinks = [
  { href: '/removalists-adelaide/', label: 'Adelaide removalists hub' },
  { href: '/house-removals-adelaide/', label: 'house removals Adelaide' },
  { href: '/furniture-removalists-adelaide/', label: 'furniture removalists Adelaide' },
  { href: '/packing-services-adelaide/', label: 'packing services Adelaide' },
  { href: '/office-removals-adelaide/', label: 'office removals Adelaide' },
  { href: '/interstate-removals-adelaide/', label: 'interstate removals Adelaide' },
  { href: '/apartment-removalists-adelaide/', label: 'apartment removalists Adelaide' },
];

const seoV5DefaultSuburbLinks = [
  { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD removals' },
  { href: '/removalists-glenelg/', label: 'Glenelg removals' },
  { href: '/removalists-marion/', label: 'Marion removals' },
  { href: '/removalists-salisbury/', label: 'Salisbury removals' },
  { href: '/removalists-norwood/', label: 'Norwood removals' },
  { href: '/removalists-mawson-lakes/', label: 'Mawson Lakes removals' },
  { href: '/removalists-andrews-farm/', label: 'Andrews Farm removals' },
  { href: '/removalists-noarlunga/', label: 'Noarlunga removals' },
];

const seoV5DefaultGuideLinks = [
  { href: '/adelaide-moving-guides/moving-cost-adelaide-2026/', label: '2026 Adelaide moving cost guide' },
  { href: '/adelaide-moving-guides/removalist-quote-checklist-adelaide/', label: 'removalist quote checklist' },
  { href: '/adelaide-moving-guides/fixed-price-vs-hourly-removalists-adelaide/', label: 'fixed price vs hourly guide' },
  { href: '/adelaide-moving-guides/how-to-choose-removalists-adelaide/', label: 'choosing Adelaide removalists' },
  { href: '/adelaide-moving-guides/apartment-moving-checklist-adelaide/', label: 'apartment moving checklist' },
  { href: '/adelaide-moving-guides/packing-fragile-items-adelaide/', label: 'packing fragile items' },
  { href: '/adelaide-moving-guides/last-minute-moving-adelaide/', label: 'last-minute moving guide' },
  { href: '/adelaide-moving-guides/interstate-moving-checklist-adelaide/', label: 'interstate moving checklist' },
];

const seoV5CommercialIntentProfiles = {
  'cheap-removalists-adelaide': {
    primaryKeyword: 'cheap removalists Adelaide',
    secondaryKeywords: ['low-cost Adelaide movers', 'cheap movers Adelaide', 'affordable removalists Adelaide'],
    searchIntent: 'risk-aware low-cost moving and hidden hourly trap comparison',
    uniqueAngle: 'cheap only works when access, inventory, travel, and inclusions are made clear before booking',
    conversionCTA: 'Get a risk-aware fixed-price quote',
  },
  'affordable-removalists-adelaide': {
    primaryKeyword: 'affordable removalists Adelaide',
    secondaryKeywords: ['best value Adelaide movers', 'affordable movers Adelaide', 'fixed-price movers Adelaide'],
    searchIntent: 'best-value comparison with scope clarity',
    uniqueAngle: 'keeps price control tied to careful handling and clear written inclusions',
    conversionCTA: 'Compare a value-focused fixed-price quote',
  },
  'removalist-cost-adelaide': {
    primaryKeyword: 'removalist cost Adelaide',
    secondaryKeywords: ['moving cost Adelaide', 'Adelaide removalist prices', 'removalist quote factors'],
    searchIntent: 'pricing factors and quote education',
    uniqueAngle: 'explains access, inventory, packing, timing, and labour variables without publishing fake universal prices',
    conversionCTA: 'Send the details that affect cost',
  },
  'moving-quotes-adelaide': {
    primaryKeyword: 'moving quotes Adelaide',
    secondaryKeywords: ['removalist quote Adelaide', 'fixed-price moving quote', 'Adelaide movers quote'],
    searchIntent: 'lead capture and quote preparation',
    uniqueAngle: 'turns route, property type, access, inventory, and date into a complete quote brief',
    conversionCTA: 'Start the quote checklist',
  },
  'fixed-price-removalists-adelaide': {
    primaryKeyword: 'fixed price removalists Adelaide',
    secondaryKeywords: ['fixed-price movers Adelaide', 'upfront moving quote Adelaide', 'no hourly surprises moving'],
    searchIntent: 'quote-first certainty',
    uniqueAngle: 'positions fixed pricing as scope discipline when traffic, stairs, lifts, and parking could change hourly cost',
    conversionCTA: 'Get fixed-price certainty',
  },
  'budget-removalists-adelaide': {
    primaryKeyword: 'budget removalists Adelaide',
    secondaryKeywords: ['budget movers Adelaide', 'value removalists Adelaide', 'small move removalists Adelaide'],
    searchIntent: 'controlled-spend and smaller move planning',
    uniqueAngle: 'keeps budget control grounded in inventory accuracy and access detail instead of rushed handling',
    conversionCTA: 'Plan a budget-aware fixed quote',
  },
  'furniture-removalists-adelaide': {
    primaryKeyword: 'furniture removalists Adelaide',
    secondaryKeywords: ['furniture movers Adelaide', 'single item movers Adelaide', 'careful furniture removals'],
    searchIntent: 'item protection and handling',
    uniqueAngle: 'centres heavy, fragile, awkward, or high-finish items and their access path',
    conversionCTA: 'Request furniture handling advice',
  },
  'house-removals-adelaide': {
    primaryKeyword: 'house removals Adelaide',
    secondaryKeywords: ['house removalists Adelaide', 'home movers Adelaide', 'family home removals'],
    searchIntent: 'full home relocation',
    uniqueAngle: 'connects rooms, garage items, outdoor inventory, access, packing, and unload order into one plan',
    conversionCTA: 'Get a home-move quote',
  },
  'local-removals-adelaide': {
    primaryKeyword: 'local removals Adelaide',
    secondaryKeywords: ['local movers Adelaide', 'Adelaide metro removals', 'suburb to suburb removals'],
    searchIntent: 'Adelaide metro moving',
    uniqueAngle: 'focuses on suburb-to-suburb route fit, parking, access, and timing across the metro area',
    conversionCTA: 'Scope a local Adelaide move',
  },
  'interstate-removals-adelaide': {
    primaryKeyword: 'interstate removalists Adelaide',
    secondaryKeywords: ['interstate removals Adelaide', 'Adelaide interstate movers', 'long distance removals Adelaide'],
    searchIntent: 'route planning and long-distance logistics',
    uniqueAngle: 'ties packing, inventory, route timing, storage, and handover risks at both ends',
    conversionCTA: 'Plan the interstate route',
  },
  'office-removals-adelaide': {
    primaryKeyword: 'office removals Adelaide',
    secondaryKeywords: ['office relocation Adelaide', 'business movers Adelaide', 'commercial removals Adelaide'],
    searchIntent: 'commercial continuity and access planning',
    uniqueAngle: 'centres downtime control, dock or lift access, IT equipment, labelling, and restart order',
    conversionCTA: 'Scope an office relocation',
  },
  'packing-services-adelaide': {
    primaryKeyword: 'packing services Adelaide',
    secondaryKeywords: ['packing and unpacking Adelaide', 'fragile packing Adelaide', 'moving packing service'],
    searchIntent: 'fragile items and time-saving preparation',
    uniqueAngle: 'clarifies packing scope by fragile items, room count, carton quality, and move-day sequencing',
    conversionCTA: 'Add packing to the move brief',
  },
};

function uniqueLinkItems(items = []) {
  const seen = new Set();
  const links = [];
  for (const item of items) {
    if (!item?.href || seen.has(item.href)) continue;
    seen.add(item.href);
    links.push(item);
  }
  return links;
}

function ensureLinkDepth(items, fallback, maxCount) {
  return uniqueLinkItems([...(items || []), ...fallback]).slice(0, maxCount);
}

export function getSeoV5IntentProfile(slug) {
  return seoV5CommercialIntentProfiles[slug] || seoV5GuideProfiles[slug] || null;
}

function buildCommercialIntentProfile(page) {
  const base = seoV5CommercialIntentProfiles[page.slug] || {
    primaryKeyword: page.title,
    secondaryKeywords: [],
    searchIntent: 'quote-ready Adelaide moving service research',
    uniqueAngle: page.hero,
    conversionCTA: 'Get a fixed-price quote',
  };
  const linkProfile = commercialLinkProfiles[page.slug] || {};

  return {
    ...base,
    relatedServices: ensureLinkDepth(linkProfile.services, seoV5DefaultServiceLinks, 6),
    relatedSuburbs: ensureLinkDepth(linkProfile.suburbs, seoV5DefaultSuburbLinks, 8),
    relatedGuides: ensureLinkDepth(linkProfile.guides, seoV5DefaultGuideLinks, 5),
    faqItems: page.faq || [],
  };
}

const guideLinkProfiles = {
  'moving-checklist-adelaide': {
    services: [
      { href: '/house-removals-adelaide/', label: 'house removals for checklist-ready bookings' },
      { href: '/packing-services-adelaide/', label: 'packing support for the final prep stage' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'city-move planning in Adelaide CBD' },
      { href: '/removalists-marion/', label: 'family-home move planning in Marion' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/suburb-move-preparation-adelaide/', label: 'suburb move preparation' },
      { href: '/adelaide-moving-guides/booking-timing-guide-adelaide/', label: 'booking timing guide' },
      { href: '/adelaide-moving-guides/packing-tips-adelaide/', label: 'packing tips guide' },
    ],
    commercial: [
      { href: '/last-minute-movers-adelaide/', label: 'last-minute movers' },
    ],
  },
  'removalist-cost-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals pricing context' },
      { href: '/cheap-removalists-adelaide/', label: 'budget-conscious Adelaide move options' },
    ],
    suburbs: [
      { href: '/removalists-glenelg/', label: 'coastal quote examples in Glenelg' },
      { href: '/removalists-salisbury/', label: 'northside pricing context in Salisbury' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/booking-timing-guide-adelaide/', label: 'booking timing guide' },
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
    ],
    commercial: [
      { href: '/cheap-removalists-adelaide/', label: 'cheap removalists' },
    ],
  },
  'apartment-moving-tips-adelaide': {
    services: [
      { href: '/apartment-removalists-adelaide/', label: 'apartment removalists' },
      { href: '/packing-services-adelaide/', label: 'packing support for lifts and corridors' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD apartment moves' },
      { href: '/removalists-mawson-lakes/', label: 'Mawson Lakes apartment access' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'general move checklist' },
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'apartment move costs' },
    ],
    commercial: [
      { href: '/apartment-removalists-adelaide/', label: 'apartment removalists' },
    ],
  },
  'storage-planning-adelaide': {
    services: [
      { href: '/storage-friendly-removals-adelaide/', label: 'storage-friendly removals' },
      { href: '/house-removals-adelaide/', label: 'house moves with a storage stop' },
    ],
    suburbs: [
      { href: '/removalists-reynella/', label: 'southern storage-linked moves' },
      { href: '/removalists-noarlunga/', label: 'coastal storage planning' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
      { href: '/adelaide-moving-guides/suburb-move-preparation-adelaide/', label: 'suburb move preparation' },
    ],
    commercial: [
      { href: '/storage-friendly-removals-adelaide/', label: 'storage-friendly removals' },
    ],
  },
  'office-relocation-preparation-adelaide': {
    services: [
      { href: '/office-relocation-adelaide/', label: 'office relocation services' },
      { href: '/office-removals-adelaide/', label: 'office removals hub' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'CBD office move planning' },
      { href: '/removalists-marion/', label: 'Marion office and clinic moves' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
      { href: '/adelaide-moving-guides/booking-timing-guide-adelaide/', label: 'timing guide for office moves' },
    ],
    commercial: [
      { href: '/office-relocation-adelaide/', label: 'office relocation' },
    ],
  },
  'packing-tips-adelaide': {
    services: [
      { href: '/packing-services-adelaide/', label: 'packing services' },
      { href: '/furniture-removalists-adelaide/', label: 'furniture handling support' },
    ],
    suburbs: [
      { href: '/removalists-glenelg/', label: 'coastal packing jobs in Glenelg' },
      { href: '/removalists-norwood/', label: 'inner-east packing support' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
      { href: '/adelaide-moving-guides/suburb-move-preparation-adelaide/', label: 'suburb move prep' },
    ],
    commercial: [
      { href: '/last-minute-movers-adelaide/', label: 'last-minute movers' },
    ],
  },
  'booking-timing-guide-adelaide': {
    services: [
      { href: '/same-day-removalists-adelaide/', label: 'same-day removalists' },
      { href: '/urgent-movers-adelaide/', label: 'urgent movers' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'tight booking windows in CBD' },
      { href: '/removalists-salisbury/', label: 'northern corridor booking' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'cost guide' },
    ],
    commercial: [
      { href: '/same-day-removalists-adelaide/', label: 'same-day removalists' },
      { href: '/last-minute-movers-adelaide/', label: 'last minute movers' },
    ],
  },
  'suburb-move-preparation-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide suburb move coverage' },
      { href: '/house-removals-adelaide/', label: 'house removals for suburb routes' },
    ],
    suburbs: [
      { href: '/removalists-norwood/', label: 'eastern suburb planning' },
      { href: '/removalists-noarlunga/', label: 'southern suburb planning' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
    ],
    commercial: [
      { href: '/cheap-removalists-adelaide/', label: 'cheap removalists' },
    ],
  },
};

const commercialLinkProfiles = {
  'cheap-removalists-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      { href: '/house-removals-adelaide/', label: 'house removals for budget-led moves' },
    ],
    suburbs: [
      { href: '/removalists-salisbury/', label: 'Salisbury move planning' },
      { href: '/removalists-marion/', label: 'Marion move planning' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
    ],
    siblings: [
      { href: '/storage-friendly-removals-adelaide/', label: 'storage-friendly removals' },
      { href: '/last-minute-removalists-adelaide/', label: 'last-minute removals' },
    ],
  },
  'affordable-removalists-adelaide': {
    services: [
      { href: '/house-removals-adelaide/', label: 'house removals with affordable fixed quotes' },
      { href: '/furniture-removalists-adelaide/', label: 'furniture removalists with careful handling' },
      { href: '/apartment-removalists-adelaide/', label: 'apartment removalists with access planning' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD fixed quote moves' },
      { href: '/removalists-glenelg/', label: 'Glenelg affordable move planning' },
      { href: '/removalists-salisbury/', label: 'Salisbury budget-aware routes' },
      { href: '/removalists-marion/', label: 'Marion local moving quotes' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
      { href: '/adelaide-moving-guides/how-to-get-accurate-removalist-quotes-adelaide/', label: 'accurate quote guide' },
      { href: '/adelaide-moving-guides/cheap-vs-fixed-price-removalists-adelaide/', label: 'cheap vs fixed price guide' },
    ],
    siblings: [
      { href: '/cheap-removalists-adelaide/', label: 'cheap removalists Adelaide' },
      { href: '/fixed-price-removalists-adelaide/', label: 'fixed-price removalists Adelaide' },
      { href: '/moving-quotes-adelaide/', label: 'moving quotes Adelaide' },
    ],
  },
  'removalist-cost-adelaide': {
    services: [
      { href: '/house-removals-adelaide/', label: 'house removals cost factors' },
      { href: '/furniture-removalists-adelaide/', label: 'furniture removal cost factors' },
      { href: '/office-removals-adelaide/', label: 'office removal quote factors' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'CBD access cost factors' },
      { href: '/removalists-glenelg/', label: 'Glenelg coastal quote factors' },
      { href: '/removalists-mawson-lakes/', label: 'Mawson Lakes apartment quote factors' },
      { href: '/removalists-salisbury/', label: 'Salisbury northern quote factors' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'full cost guide' },
      { href: '/adelaide-moving-guides/how-to-get-accurate-removalist-quotes-adelaide/', label: 'accurate quote guide' },
      { href: '/adelaide-moving-guides/cheap-vs-fixed-price-removalists-adelaide/', label: 'hourly vs fixed-price guide' },
    ],
    siblings: [
      { href: '/moving-quotes-adelaide/', label: 'moving quotes Adelaide' },
      { href: '/fixed-price-removalists-adelaide/', label: 'fixed-price removalists' },
      { href: '/affordable-removalists-adelaide/', label: 'affordable removalists' },
    ],
  },
  'moving-quotes-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removalists quote path' },
      { href: '/house-removals-adelaide/', label: 'house moving quotes' },
      { href: '/same-day-removalists-adelaide/', label: 'same-day quote checks' },
    ],
    suburbs: [
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm moving quotes' },
      { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD moving quotes' },
      { href: '/removalists-glenelg/', label: 'Glenelg moving quotes' },
      { href: '/removalists-marion/', label: 'Marion moving quotes' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/how-to-get-accurate-removalist-quotes-adelaide/', label: 'accurate removalist quotes' },
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
    ],
    siblings: [
      { href: '/removalist-cost-adelaide/', label: 'removalist cost Adelaide' },
      { href: '/fixed-price-removalists-adelaide/', label: 'fixed-price movers' },
      { href: '/cheap-removalists-adelaide/', label: 'cheap removalists Adelaide' },
    ],
  },
  'same-day-removalists-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      { href: '/apartment-removalists-adelaide/', label: 'apartment removals for tight schedules' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'CBD urgent move planning' },
      { href: '/removalists-norwood/', label: 'inner-east short-notice moves' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/booking-timing-guide-adelaide/', label: 'booking timing guide' },
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
    ],
    siblings: [
      { href: '/last-minute-removalists-adelaide/', label: 'last-minute removals' },
      { href: '/apartment-removalists-adelaide/', label: 'apartment removals' },
    ],
  },
  'last-minute-removalists-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      { href: '/house-removals-adelaide/', label: 'house removals when the booking window is short' },
    ],
    suburbs: [
      { href: '/removalists-salisbury/', label: 'Salisbury short-notice moves' },
      { href: '/removalists-glenelg/', label: 'Glenelg last-minute coastal moves' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/booking-timing-guide-adelaide/', label: 'booking timing guide' },
      { href: '/adelaide-moving-guides/packing-tips-adelaide/', label: 'packing tips guide' },
    ],
    siblings: [
      { href: '/same-day-removalists-adelaide/', label: 'same-day removals' },
      { href: '/cheap-removalists-adelaide/', label: 'cheap removalists' },
    ],
  },
  'apartment-removalists-adelaide': {
    services: [
      { href: '/house-removals-adelaide/', label: 'house and apartment removals' },
      { href: '/packing-services-adelaide/', label: 'packing support for shared-building moves' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD apartment routes' },
      { href: '/removalists-mawson-lakes/', label: 'Mawson Lakes apartment access' },
      { href: '/removalists-glenelg/', label: 'Glenelg apartment removals' },
      { href: '/removalists-north-adelaide/', label: 'North Adelaide unit moves' },
      { href: '/removalists-norwood/', label: 'Norwood shared-entry moves' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/apartment-moving-tips-adelaide/', label: 'apartment moving tips' },
      { href: '/adelaide-moving-guides/apartment-lift-bookings-adelaide/', label: 'lift booking guide' },
    ],
    siblings: [
      { href: '/same-day-removalists-adelaide/', label: 'same-day removals' },
      { href: '/office-relocation-adelaide/', label: 'office relocation support' },
    ],
  },
  'office-relocation-adelaide': {
    services: [
      { href: '/office-removals-adelaide/', label: 'office removals Adelaide' },
      { href: '/packing-services-adelaide/', label: 'packing support for workstations and files' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'CBD office routes' },
      { href: '/removalists-marion/', label: 'Marion commercial relocations' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/office-relocation-preparation-adelaide/', label: 'office relocation preparation guide' },
      { href: '/adelaide-moving-guides/office-access-planning-adelaide-cbd/', label: 'office access planning guide' },
    ],
    siblings: [
      { href: '/same-day-removalists-adelaide/', label: 'same-day removals' },
      { href: '/storage-friendly-removals-adelaide/', label: 'storage-friendly removals' },
    ],
  },
  'storage-friendly-removals-adelaide': {
    services: [
      { href: '/house-removals-adelaide/', label: 'house moves with a storage stage' },
      { href: '/interstate-removals-adelaide/', label: 'interstate removals with staged delivery' },
    ],
    suburbs: [
      { href: '/removalists-reynella/', label: 'Reynella storage-linked planning' },
      { href: '/removalists-noarlunga/', label: 'Noarlunga storage-linked planning' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/storage-planning-adelaide/', label: 'storage planning guide' },
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
    ],
    siblings: [
      { href: '/cheap-removalists-adelaide/', label: 'cheap removalists' },
      { href: '/office-relocation-adelaide/', label: 'office relocation services' },
    ],
  },
  'urgent-movers-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      { href: '/same-day-removalists-adelaide/', label: 'same-day removalist service' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'CBD urgent access' },
      { href: '/removalists-salisbury/', label: 'Salisbury short-notice moves' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/booking-timing-guide-adelaide/', label: 'booking timing guide' },
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist' },
    ],
    siblings: [
      { href: '/last-minute-movers-adelaide/', label: 'last minute movers' },
      { href: '/same-day-removalists-adelaide/', label: 'same day removals' },
    ],
  },
  'last-minute-movers-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      { href: '/house-removals-adelaide/', label: 'house removals short-notice' },
    ],
    suburbs: [
      { href: '/removalists-marion/', label: 'Marion local moves' },
      { href: '/removalists-norwood/', label: 'Norwood local planning' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/booking-timing-guide-adelaide/', label: 'booking timing guide' },
      { href: '/adelaide-moving-guides/suburb-move-preparation-adelaide/', label: 'suburb move prep' },
    ],
    siblings: [
      { href: '/urgent-movers-adelaide/', label: 'urgent movers' },
      { href: '/last-minute-removalists-adelaide/', label: 'last minute removalists' },
    ],
  },
  'fixed-price-removalists-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      { href: '/house-removals-adelaide/', label: 'house removals with fixed pricing' },
    ],
    suburbs: [
      { href: '/removalists-adelaide-cbd/', label: 'CBD apartment fixed quotes' },
      { href: '/removalists-norwood/', label: 'inner-east local moves' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
      { href: '/adelaide-moving-guides/booking-timing-guide-adelaide/', label: 'booking timing guide' },
    ],
    siblings: [
      { href: '/cheap-vs-fixed-price-removalists-adelaide/', label: 'cheap vs fixed price comparison' },
      { href: '/apartment-removalists-adelaide/', label: 'apartment removals' },
    ],
  },
  'cheap-vs-fixed-price-removalists-adelaide': {
    services: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      { href: '/fixed-price-removalists-adelaide/', label: 'fixed-price removals explanation' },
    ],
    suburbs: [
      { href: '/removalists-salisbury/', label: 'northern suburb value moves' },
      { href: '/removalists-marion/', label: 'south-west value moves' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
      { href: '/adelaide-moving-guides/suburb-move-preparation-adelaide/', label: 'suburb move prep' },
    ],
    siblings: [
      { href: '/cheap-removalists-adelaide/', label: 'cheap removalists Adelaide' },
      { href: '/fixed-price-removalists-adelaide/', label: 'fixed price removalists' },
    ],
  },
  'budget-removalists-adelaide': {
    services: [
      { href: '/house-removals-adelaide/', label: 'budget-conscious house removals' },
      { href: '/furniture-removalists-adelaide/', label: 'budget furniture removals' },
      { href: '/packing-services-adelaide/', label: 'packing support when it protects the budget' },
    ],
    suburbs: [
      { href: '/removalists-salisbury/', label: 'Salisbury budget move planning' },
      { href: '/removalists-elizabeth/', label: 'Elizabeth budget move planning' },
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm budget routes' },
      { href: '/removalists-marion/', label: 'Marion value-focused moves' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'Adelaide cost guide' },
      { href: '/adelaide-moving-guides/cheap-vs-fixed-price-removalists-adelaide/', label: 'cheap vs fixed price guide' },
      { href: '/adelaide-moving-guides/how-to-get-accurate-removalist-quotes-adelaide/', label: 'accurate quote guide' },
    ],
    siblings: [
      { href: '/cheap-removalists-adelaide/', label: 'cheap removalists Adelaide' },
      { href: '/affordable-removalists-adelaide/', label: 'affordable removalists Adelaide' },
      { href: '/moving-quotes-adelaide/', label: 'moving quotes Adelaide' },
    ],
  },
};

function formatClusterLabel(clusterKey) {
  return toTitle(normalizeClusterKey(clusterKey));
}

function getGeneratedPageImage({ type, slug, title, suburb, clusterKey, logisticsLabel, topic }) {
  let asset = null;

  if (type === 'suburb') {
    asset = generatedPageImageAssignments.suburb[normalizeClusterKey(clusterKey)] || generatedPageImageAssignments.suburb.default;
  } else if (type === 'guide') {
    asset = generatedPageImageAssignments.guide[slug] || generatedPageImageAssignments.guide.default;
  } else if (type === 'commercial') {
    asset = generatedPageImageAssignments.commercial[slug] || imageAssets.homepage;
  }

  if (!asset) {
    return null;
  }

  return {
    ...asset,
    alt: buildGeneratedImageAlt({ type, suburb, clusterKey, logisticsLabel, title, topic }),
    title:
      type === 'suburb'
        ? `${suburb} removals planning`
        : type === 'guide'
          ? `${title} guide image`
          : `${title} service image`,
    caption:
      type === 'suburb'
        ? `${suburb} moving support across ${formatClusterLabel(clusterKey).toLowerCase()} routes in Adelaide.`
        : type === 'guide'
          ? `Planning support for Adelaide customers researching ${topic}.`
          : `${title} with quote-first planning for Adelaide moves.`,
  };
}

function buildGeneratedImageAlt({ type, suburb, clusterKey, logisticsLabel, title, topic }) {
  if (type === 'suburb') {
    return `${BUSINESS_NAME} ${suburb} removalists planning image for ${formatClusterLabel(clusterKey).toLowerCase()} access and ${logisticsLabel}`;
  }

  if (type === 'guide') {
    return `${BUSINESS_NAME} Adelaide moving guide image for ${topic} and quote-ready planning`;
  }

  return `${BUSINESS_NAME} ${title} planning image for Adelaide moves`;
}

function getSuburbCtaTheme(clusterKey) {
  const actions = {
    coastal: 'Plan coastal move',
    'southern coastal': 'Plan staged coastal move',
    southern: 'Book family-home move',
    northern: 'Get suburb-specific quote',
    'northern fringe': 'Book larger-home move',
    eastern: 'Book access-aware move',
    'inner east': 'Book access-aware move',
    'inner north': 'Book compact-street move',
    'inner south': 'Book townhouse move',
    western: 'Book mixed-access move',
    'south-west': 'Book mixed-use move',
    hills: 'Book slope-aware move',
    'eastern hills': 'Book slope-aware move',
    'CBD fringe': 'Book apartment move',
    CBD: 'Book city move',
    'north-adelaide': 'Book premium local move',
    'north-eastern': 'Get suburb-specific quote',
    'west-north': 'Get suburb-specific quote',
  };

  return actions[normalizeClusterKey(clusterKey)] || 'Get suburb-specific quote';
}

function buildSuburbTraits(logisticsLabel, clusterKey) {
  const haystack = `${normalizeClusterKey(clusterKey)} ${logisticsLabel}`.toLowerCase();
  const traits = [];

  if (/apartment|lift|unit|townhouse/.test(haystack)) traits.push('apartment');
  if (/family|garage|driveway|house|estate|larger home/.test(haystack)) traits.push('family-home');
  if (/storage|staged|split handover/.test(haystack)) traits.push('storage');
  if (/office|commercial|mixed-use|warehouse/.test(haystack)) traits.push('office');
  if (/coastal|beach|harbour|waterfront/.test(haystack)) traits.push('coastal');
  if (/heritage|villa|terrace/.test(haystack)) traits.push('heritage');
  if (/hill|slope|driveway/.test(haystack)) traits.push('hillside');

  if (traits.length === 0) {
    traits.push('local');
  }

  return [...new Set(traits)];
}

function buildSuburbHighlights({ suburb, logisticsLabel, clusterKey, nearby }) {
  const traits = buildSuburbTraits(logisticsLabel, clusterKey);
  const highlights = [
    `${toTitle(logisticsLabel)} scoped before quoting`,
    `${nearby.slice(0, 2).map((item) => item.suburb).join(' and ')} links for route comparison`,
  ];

  if (traits.includes('apartment')) highlights.push('Apartment, unit, and shared-entry access mapped early');
  if (traits.includes('family-home')) highlights.push('Family-home inventory and garage loads staged before move day');
  if (traits.includes('storage')) highlights.push('Storage stops and staged delivery handled in one plan');
  if (traits.includes('office')) highlights.push('Mixed-use and office inventory sequenced around access windows');
  if (traits.includes('coastal')) highlights.push('Coastal parking and carry distance reviewed before the booking is locked');
  if (traits.includes('heritage')) highlights.push('Heritage entries and tighter turning space considered early');
  if (traits.includes('hillside')) highlights.push('Slope-aware carrying and driveway access planned into labour time');

  if (highlights.length < 3) {
    highlights.push(`Linked back to Adelaide removals coverage for broader ${suburb} route planning`);
  }

  return highlights.slice(0, 4);
}

function buildSuburbIntroParagraphs({ suburb, intro, logisticsLabel, nearby, clusterKey, supportProfile }) {
  const clusterLabel = formatClusterLabel(clusterKey).toLowerCase();
  const supportServices = supportProfile.services.slice(0, 2).map((item) => item.label).join(' and ');

  return [
    `${intro} If you are comparing removalists near ${suburb} or affordable removalists ${suburb}, check parking, access, stairs, lifts, furniture volume, and timing. A fixed-price quote for ${suburb} moves should be based on the real access path, not a vague headline rate.`,
    `${suburb} moves usually perform better when the quote is based on the real access path, the inventory mix, and the timing pressure on the street or in the building. For this suburb, that often means clarifying ${logisticsLabel} before labour, vehicle setup, and the unload order are locked in.`,
    `This page is designed as a stronger local entry point, not a thin suburb mention. It keeps ${suburb} connected to the Adelaide removals hub, nearby comparison routes like ${nearby.map((item) => item.suburb).join(', ')}, and the most useful services for ${clusterLabel} moves, including ${supportServices}.`,
  ];
}

function buildSuburbSummaryCards({ suburb, logisticsLabel, supportProfile, traits }) {
  return [
    {
      title: `Local service summary for ${suburb}`,
      copy: `${suburb} jobs can flow into house removals, apartment work, packing support, storage staging, or interstate handoff depending on the route. The common thread is that the job is scoped around ${logisticsLabel}, not a generic suburb template.`,
      points: [
        'Local and Adelaide-wide routes scoped from one brief',
        'Inventory, access, and timing reviewed before scheduling',
        'Premium handling without forcing a long sales loop',
      ],
    },
    {
      title: 'What improves quote accuracy',
      copy: `The strongest enquiry explains the property type, stair or lift setup, parking position, and whether the move includes bulky furniture, storage, packing, or a second stop.`,
      points: [
        'Pickup and delivery suburbs confirmed early',
        'Heavy or fragile items listed up front',
        'Property access notes included before move day',
      ],
    },
    {
      title: 'Best-fit service paths',
      copy: `The related services for ${suburb} follow the local access pattern rather than forcing the same route through every page. That is why ${supportProfile.services.slice(0, 2).map((item) => item.label).join(' and ')} sit close to this suburb brief.`,
      points: [
        traits.includes('apartment') ? 'Apartment access stays tied to loading, lifts, and timing' : 'Residential access stays tied to property layout and carry path',
        traits.includes('storage') ? 'Storage staging can be added without breaking the route plan' : 'Packing and furniture handling can be scoped in the same job',
        traits.includes('office') ? 'Mixed-use loads can still be handled under one operational brief' : 'Broader Adelaide links stay visible for comparison and quote support',
      ],
    },
  ];
}

function buildSuburbLogisticsCards({ suburb, logisticsLabel, clusterKey, nearby }) {
  const clusterLabel = formatClusterLabel(clusterKey);
  const traits = buildSuburbTraits(logisticsLabel, clusterKey);

  return [
    {
      title: `${clusterLabel} access checks`,
      copy: `${suburb} sits inside a ${clusterLabel.toLowerCase()} pattern where route timing, street position, and the carry path can change the labour plan quickly.`,
      points: [
        `Nearby route comparisons include ${nearby.slice(0, 2).map((item) => item.suburb).join(' and ')}`,
        `${toTitle(logisticsLabel)} should be mentioned before the quote is approved`,
        'Short local distance does not remove access-driven delays',
      ],
    },
    {
      title: 'Loading and unloading pressure',
      copy: `The job often turns on how quickly the truck can be positioned and how much reshuffling is avoided at both ends of the route.`,
      points: [
        traits.includes('coastal') ? 'Parking pressure and weather exposure can slow loading' : 'Entry width and stair counts affect how the first hour runs',
        traits.includes('apartment') ? 'Shared-building rules and lift windows shape the unload order' : 'Driveways, garages, and room order shape the unload order',
        'Priority rooms and fragile items should be identified before loading begins',
      ],
    },
    {
      title: 'Access notes worth mentioning',
      copy: `The better the access notes, the less the move depends on assumptions. That keeps labour, timing, and handling expectations aligned.`,
      points: [
        'Stairs, service lifts, loading docks, or long carries',
        'Street parking limits, driveway slope, or narrow entries',
        'Storage stops, office equipment, or larger furniture that needs extra protection',
      ],
    },
  ];
}

function buildSuburbMoveTypeCards({ suburb, logisticsLabel, clusterKey }) {
  const traits = buildSuburbTraits(logisticsLabel, clusterKey);
  const cards = [];
  const fallbackCards = [
    {
      title: 'Local household relocations',
      copy: `${suburb} household moves still benefit from a room-by-room plan that matches the actual load and access path.`,
      points: ['Useful for standard Adelaide house and unit routes'],
    },
    {
      title: 'Packing and protection support',
      copy: `Packing support can be added when the move includes fragile rooms, compressed timing, or furniture that needs cleaner wrapping.`,
      points: ['Useful when preparation quality shapes move-day speed'],
    },
    {
      title: 'Broader Adelaide handoff',
      copy: `${suburb} visitors should still be able to move naturally into Adelaide-wide service pages and quote paths once the local angle is clear.`,
      points: ['Useful when suburb research turns into a service-led enquiry'],
    },
  ];

  if (traits.includes('apartment')) {
    cards.push({
      title: 'Apartment and unit moves',
      copy: `${suburb} apartment jobs are best scoped around lift timing, corridor clearance, and the order bulky items enter or leave the building.`,
      points: ['Useful for towers, units, and tighter townhouse layouts'],
    });
  }

  if (traits.includes('family-home')) {
    cards.push({
      title: 'Family-home relocations',
      copy: `${suburb} family-home moves often include garage stock, outdoor furniture, and a bigger room count than the first estimate suggests.`,
      points: ['Useful when inventory size and room order affect the day'],
    });
  }

  if (traits.includes('storage')) {
    cards.push({
      title: 'Storage-linked routes',
      copy: `${suburb} moves can include a storage stage, a renovation gap, or a staggered handover that needs the load sequenced for more than one destination.`,
      points: ['Useful for split delivery, downsizing, and settlement gaps'],
    });
  }

  if (traits.includes('office')) {
    cards.push({
      title: 'Office and mixed-use inventory',
      copy: `${suburb} can also trigger office or clinic-style work where desks, shelves, labelled crates, or mixed residential-commercial stock need cleaner restart planning.`,
      points: ['Useful for mixed-use corridors and business-critical resets'],
    });
  }

  if (traits.includes('coastal')) {
    cards.push({
      title: 'Coastal home and apartment work',
      copy: `${suburb} coastal jobs need more deliberate loading because parking windows, beachside frontage, and exposed access points can extend the day.`,
      points: ['Useful for beachside homes, apartments, and shared entries'],
    });
  }

  if (traits.includes('heritage')) {
    cards.push({
      title: 'Heritage and premium access moves',
      copy: `${suburb} often suits more careful furniture flow where entries, stair geometry, or higher-finish interiors reward a more deliberate sequence.`,
      points: ['Useful for villas, terraces, and premium handling'],
    });
  }

  if (traits.includes('hillside')) {
    cards.push({
      title: 'Slope-aware loading plans',
      copy: `${suburb} hillside access changes how crews stage heavier furniture, longer carries, and driveway turns before the truck is loaded.`,
      points: ['Useful when slopes and distance change carrying time'],
    });
  }

  for (const fallbackCard of fallbackCards) {
    if (cards.length >= 3) break;
    cards.push(fallbackCard);
  }

  return cards.slice(0, 3);
}

function buildSuburbFaqItems({ suburb, logisticsLabel, nearby, clusterKey }) {
  return [
    {
      question: `Do you service ${suburb}?`,
      answer: `Yes. ZQ Removals services ${suburb} and nearby Adelaide suburbs with fixed-price quotes based on the route, property access, inventory, and timing requirements.`,
    },
    {
      question: `Can you move furniture in ${suburb}?`,
      answer: `Yes. We can move furniture in ${suburb}, including bulky, fragile, apartment, family-home, and storage-linked items when the access path and protection needs are supplied early.`,
    },
    {
      question: `Do you offer same-day removals near ${suburb}?`,
      answer: `Same-day removals near ${suburb} may be available subject to crew schedule, route, inventory, parking, and access conditions. Calling is the fastest way to check availability.`,
    },
    {
      question: `How do I get a quote for ${suburb}?`,
      answer: `Send the pickup suburb, delivery suburb, move date, property type, item list, and access notes through the quote form, or call ZQ Removals for urgent ${suburb} bookings.`,
    },
    {
      question: `What affects the price of a ${suburb} move?`,
      answer: `The price of a ${suburb} move is affected by inventory, truck size, number of movers, stairs, lifts, parking, carry distance, packing, heavy items, timing, and whether the route includes storage or multiple stops.`,
    },
    {
      question: `Which nearby suburbs are most relevant when comparing ${suburb} routes?`,
      answer: `${nearby.map((item) => item.suburb).join(', ')} are practical comparison points because they share similar route pressure, access patterns, or corridor timing.`,
    },
    ...getFaqPool(clusterKey),
  ];
}

function buildGuideChecklistCards(topic) {
  const cards = {
    'moving checklist': [
      { title: 'Confirm the route', copy: 'Lock in the pickup suburb, delivery suburb, property type, and any access constraints before comparing quotes.' },
      { title: 'List the larger items', copy: 'Whitegoods, bulky furniture, gym gear, and storage cages should be included before the moving day is priced.' },
      { title: 'Decide what needs support', copy: 'Packing, storage, furniture-only handling, or an interstate leg should sit inside the same move brief.' },
    ],
    'cost guide': [
      { title: 'What changes the quote', copy: 'Access, inventory size, stair runs, and the quality of the route brief matter more than headline suburb distance.' },
      { title: 'Why cheaper is not always simpler', copy: 'Low-cost quotes often drift when parking, heavy items, or property access were never clarified.' },
      { title: 'How to compare value', copy: 'Look for transparent inclusions, realistic labour assumptions, and a clear path from quote to move-day execution.' },
    ],
    'apartment moves': [
      { title: 'Book lifts early', copy: 'Service lifts, loading docks, and shared corridors control the timing more than the suburb name alone.' },
      { title: 'Protect common areas', copy: 'The move plan should reflect how trolleys, wraps, and staging protect building finishes and reduce complaints.' },
      { title: 'Reduce bottlenecks', copy: 'Bulky items and room priority should be sequenced before the truck arrives.' },
    ],
    'storage planning': [
      { title: 'Sequence the load', copy: 'Storage works better when the pickup, storage stop, and final delivery are treated as one route plan.' },
      { title: 'Label by destination', copy: 'Downsizing and staged handovers are easier when cartons and furniture are grouped by the next stop.' },
      { title: 'Prevent double handling', copy: 'The goal is to minimise reload friction, not just add an extra stop to the same move day.' },
    ],
    'office preparation': [
      { title: 'Map the restart order', copy: 'Desks, monitors, files, and shared equipment should be staged according to what staff need first.' },
      { title: 'Confirm building access', copy: 'Dock bookings, after-hours access, and lift windows should be checked before the date is locked.' },
      { title: 'Separate critical equipment', copy: 'IT gear and high-priority items should not be buried inside the general load.' },
    ],
    'packing tips': [
      { title: 'Protect by category', copy: 'Fragile kitchenware, framed items, and heavier books need different carton choices and wrapping standards.' },
      { title: 'Pack for the unload', copy: 'Labels should reflect room order and first-night priority, not just what was nearest when the box was filled.' },
      { title: 'Leave awkward items visible', copy: 'Oversized pieces, mirrors, and heavy furniture should be flagged before moving day.' },
    ],
    'booking timing': [
      { title: 'Book early when the brief is complex', copy: 'Access-sensitive, apartment, interstate, and staged moves benefit from more lead time than a simple suburb swap.' },
      { title: 'Short notice still needs detail', copy: 'Same-day and last-minute moves only work when access and inventory details are supplied quickly.' },
      { title: 'Reduce avoidable delays', copy: 'The route, parking setup, and move scope should be clarified before the truck is allocated.' },
    ],
    'suburb move prep': [
      { title: 'Use the right suburb page', copy: 'A suburb page is useful when the address is already known and the route needs local context before quoting.' },
      { title: 'Keep service links visible', copy: 'Suburb research should still connect to the best-fit service page, guide, and quote path.' },
      { title: 'Describe the access pattern', copy: 'Suburb-level planning is only helpful when it reflects the actual property and not a generic postcode summary.' },
    ],
  };

  return cards[topic] || cards['moving checklist'];
}

function buildCommercialHighlights(page) {
  const defaults = {
    'cheap-removalists-adelaide': [
      'Accurate scoping keeps low-cost quotes realistic',
      'Budget-friendly routes still need premium handling standards',
      'Useful for local household and suburb-led moves',
    ],
    'affordable-removalists-adelaide': [
      'Affordable fixed-price options scoped before booking',
      'Careful furniture handling stays part of the value',
      'Useful for house, apartment, office, and local suburb moves',
    ],
    'removalist-cost-adelaide': [
      'Cost factors explained before the quote request',
      'Fixed-price moving can reduce hourly surprises',
      'Useful for comparing access, inventory, truck size, and timing',
    ],
    'moving-quotes-adelaide': [
      'Fast quote path for call or form enquiries',
      'Quote accuracy improves with access and inventory detail',
      'Useful for customers ready to request a fixed-price option',
    ],
    'same-day-removalists-adelaide': [
      'Fast confirmation depends on early access detail',
      'Useful for urgent residential, apartment, and compact commercial jobs',
      'Built for shorter response loops without sloppy quoting',
    ],
    'last-minute-removalists-adelaide': [
      'Short-notice jobs still need route clarity',
      'Useful when the booking window is tight but care still matters',
      'Connected to planning guides that reduce friction fast',
    ],
    'apartment-removalists-adelaide': [
      'Lift timing, corridor width, and loading windows matter first',
      'Useful for towers, units, and tight-access townhouses',
      'Linked to suburb pages where apartment demand is strongest',
    ],
    'office-relocation-adelaide': [
      'Downtime control is part of the move brief',
      'Useful for desks, monitors, files, and staged resets',
      'Connected to CBD and commercial access planning content',
    ],
    'storage-friendly-removals-adelaide': [
      'Pickup, storage, and delivery should be staged in one plan',
      'Useful for renovations, downsizing, and settlement gaps',
      'Built for moves that need more than one destination',
    ],
    'fixed-price-removalists-adelaide': [
      'Fixed-price quote options built from the actual move brief',
      'Useful when access, traffic, stairs, or lifts could change timing',
      'Designed for cost control without weakening service quality',
    ],
    'budget-removalists-adelaide': [
      'Budget-aware planning without low-quality handling',
      'Useful for customers comparing value, scope, and inclusions',
      'Clear route and inventory details keep the quote realistic',
    ],
  };

  return defaults[page.slug] || [
    'Service page built for quote-ready Adelaide intent',
    'Linked back to suburbs, guides, and related services',
    'Focused on route fit rather than filler copy',
  ];
}

function buildCommercialFactorCards(page) {
  const cards = {
    'cheap-removalists-adelaide': [
      { title: 'What keeps the quote lean', copy: 'Accurate inventory, clear access notes, and a realistic route brief stop cheap quotes from drifting later.' },
      { title: 'Where value is protected', copy: 'Careful handling, transparent inclusions, and less rework matter more than chasing the lowest headline number.' },
      { title: 'Who this page fits', copy: 'Clients comparing local Adelaide options and trying to stay budget-conscious without dropping service quality.' },
    ],
    'affordable-removalists-adelaide': [
      { title: 'Where affordability comes from', copy: 'A clear route, accurate item list, and realistic access notes help reduce uncertainty before the quote is set.' },
      { title: 'What still needs premium care', copy: 'Furniture protection, fragile-item handling, and shared-building access should remain part of the quote even on affordable moves.' },
      { title: 'What affects the quote', copy: 'Truck size, number of movers, stairs, lifts, distance, packing, heavy items, weekends, and after-hours access can all change the scope.' },
    ],
    'removalist-cost-adelaide': [
      { title: 'Truck size and crew', copy: 'Inventory volume, bulky furniture, and the number of movers required shape the labour and vehicle plan.' },
      { title: 'Access and timing', copy: 'Stairs, lifts, parking, long carries, after-hours access, and weekend pressure can change how the job is scheduled.' },
      { title: 'Packing and heavy items', copy: 'Cartons, fragile packing, antiques, gym equipment, pianos, or heavy items should be disclosed before the quote is approved.' },
    ],
    'moving-quotes-adelaide': [
      { title: 'Quote-ready route detail', copy: 'Pickup suburb, delivery suburb, property types, and preferred date give the team the first layer of quote accuracy.' },
      { title: 'Inventory and access', copy: 'Room count, large furniture, stairs, lifts, parking, and carry distance explain how much work the route really needs.' },
      { title: 'Call or form path', copy: 'Urgent moves should call. Detailed non-urgent moves can use the quote form and include access notes for a fixed-price review.' },
    ],
    'same-day-removalists-adelaide': [
      { title: 'What makes same-day viable', copy: 'A workable schedule, fast access confirmation, and an inventory summary that can be priced without guesswork.' },
      { title: 'What usually causes delays', copy: 'Parking uncertainty, building restrictions, and heavy items that were never listed in the first call. Same-day bookings stay subject to availability.' },
      { title: 'Where the page helps', copy: 'Urgent Adelaide moves that still need a sensible plan, not a rushed commitment with missing scope.' },
    ],
    'last-minute-removalists-adelaide': [
      { title: 'What the team needs first', copy: 'Addresses, preferred date, property type, and the key access risks that could affect labour and timing.' },
      { title: 'How to avoid price drift', copy: 'Supply the move brief once, clearly, so the quote reflects the real route instead of a short-notice assumption. Last-minute bookings stay subject to availability.' },
      { title: 'Where this page fits', copy: 'Searchers who are already urgent but still want a premium-standard operator and cleaner communication.' },
    ],
    'apartment-removalists-adelaide': [
      { title: 'What shapes apartment timing', copy: 'Lift bookings, loading docks, corridor distance, and whether the building has fixed move windows.' },
      { title: 'How the load is sequenced', copy: 'Bulky furniture and priority rooms should be planned for the building layout before the truck arrives.' },
      { title: 'Where this page fits', copy: 'Adelaide apartments, units, and shared-entry moves where access detail decides the day.' },
    ],
    'office-relocation-adelaide': [
      { title: 'What reduces downtime', copy: 'A staged reset order, clean labelling, and building access that matches when teams actually need the space back.' },
      { title: 'How the commercial brief is built', copy: 'Desks, monitors, files, stock, and critical equipment are mapped to the restart plan rather than packed blindly.' },
      { title: 'Where this page fits', copy: 'Businesses that need a more operationally aware Adelaide relocation plan than a generic office move promise.' },
    ],
    'storage-friendly-removals-adelaide': [
      { title: 'What makes storage routes different', copy: 'Extra handling and more than one destination mean the load order has to match what gets delivered first.' },
      { title: 'How staged delivery helps', copy: 'Renovation gaps, downsizing, and settlement timing are easier when storage is already part of the route plan.' },
      { title: 'Where this page fits', copy: 'Moves that need a storage stop, split handover, or wider route strategy before quoting.' },
    ],
    'fixed-price-removalists-adelaide': [
      { title: 'What fixes the price', copy: 'The quote is built from route, inventory, access, packing, timing, and item-handling details.' },
      { title: 'Why it can be safer', copy: 'A fixed-price quote can reduce exposure to traffic, lift delays, stairs, or slow hourly billing when the scope is accurate.' },
      { title: 'What must be accurate', copy: 'The supplied inventory and access notes need to match the job so the fixed price remains fair and workable.' },
    ],
    'budget-removalists-adelaide': [
      { title: 'What protects the budget', copy: 'Clear scope, accurate access notes, and no hidden inventory are the best ways to keep a budget move predictable.' },
      { title: 'Where cheap becomes risky', copy: 'Weak inclusions, rushed handling, missing insurance context, or unlisted access conditions can turn a low headline into poor value.' },
      { title: 'How ZQ positions value', copy: 'The goal is affordable fixed-price options with careful handling, not a race to the lowest low-quality promise.' },
    ],
  };

  return cards[page.slug] || [];
}

function renderBreadcrumbMarkup(items) {
  return `<nav aria-label="Breadcrumb" class="breadcrumb"><ol>${items
    .map((item) => (item.href ? `<li><a href="${escapeAttribute(normalizeInternalHref(item.href))}">${escapeHtml(item.label)}</a></li>` : `<li>${escapeHtml(item.label)}</li>`))
    .join('')}</ol></nav>`;
}

function getHeroMediaNote(pageType) {
  switch (pageType) {
    case 'suburb':
      return {
        eyebrow: 'Local route planning',
        title: 'Suburb-level access matters before the quote is confirmed.',
        copy: 'Apartment access, stair carries, parking pressure, storage stops, and corridor timing all change the brief.',
      };
    case 'guide':
      return {
        eyebrow: 'Planning support',
        title: 'Use the guide to sharpen the move brief before you enquire.',
        copy: 'The goal is to turn pricing, access, and handling questions into a clearer quote request.',
      };
    default:
      return {
        eyebrow: 'Service fit',
        title: 'Quote quality improves when the move details are reviewed together.',
        copy: 'Addresses, property type, inventory mix, timing, and access notes should travel through the same brief.',
      };
  }
}

function renderHeroMedia(image, pageType) {
  const note = getHeroMediaNote(pageType);
  const noteMarkup = `<div class="page-hero-media-note">
  <span class="proof-label">${escapeHtml(note.eyebrow)}</span>
  <strong>${escapeHtml(note.title)}</strong>
  <p>${escapeHtml(note.copy)}</p>
</div>`;

  if (!image) {
    return `<div class="page-hero-media page-hero-media-stack">${noteMarkup}</div>`;
  }

  return `<div class="page-hero-media page-hero-media-stack">
  <figure class="media-frame" data-generated-module="hero-image">
    <img alt="${escapeAttribute(image.alt)}" decoding="async" fetchpriority="high" height="${escapeAttribute(image.height || 900)}" loading="eager" src="${escapeAttribute(image.path)}" width="${escapeAttribute(image.width || 1200)}" />
  </figure>
  ${noteMarkup}
</div>`;
}

function renderPageHero({ eyebrow, title, lead, supporting = [], points = [], primaryCta, secondaryCta, image, breadcrumbs, pageType }) {
  return `<section class="hero-shell page-hero-shell-premium" data-generated-module="hero-title">
  <div class="container">
    ${renderBreadcrumbMarkup(breadcrumbs)}
    <div class="page-hero-grid">
      <div class="page-hero-copy">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(lead)}</p>
        ${supporting.length > 0 ? `<div class="page-hero-support-grid">${supporting.map((item) => `<p class="field-note page-hero-support-note">${escapeHtml(item)}</p>`).join('')}</div>` : ''}
        ${points.length > 0 ? `<ul aria-label="${escapeAttribute(title)} highlights" class="route-meta route-meta-premium">
          ${points.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>` : ''}
        <div class="cta-cluster" data-generated-cta="top" data-generated-page-type="${escapeAttribute(pageType)}">
          <a class="button button-primary" href="${escapeAttribute(normalizeInternalHref(primaryCta.href))}">${escapeHtml(primaryCta.label)}</a>
          <a class="button button-secondary" href="${escapeAttribute(normalizeInternalHref(secondaryCta.href))}">${escapeHtml(secondaryCta.label)}</a>
          <a class="button button-secondary" href="tel:+61433819989">Call 0433 819 989</a>
        </div>
        <div class="cta-reassurance" aria-label="Quote reassurance">
          <p>Fixed pricing - no hidden costs</p>
          <p>Fast response after brief review</p>
          <p>Planned around your actual move details</p>
        </div>
      </div>
      ${renderHeroMedia(image, pageType)}
    </div>
  </div>
</section>`;
}

function renderSectionHeading(eyebrow, heading, intro = '') {
  return `<div class="section-heading">
  <span class="eyebrow">${escapeHtml(eyebrow)}</span>
  <h2>${escapeHtml(heading)}</h2>
  ${intro ? `<p>${escapeHtml(intro)}</p>` : ''}
</div>`;
}

function renderTextSection({ id = '', module, eyebrow, heading, intro = '', paragraphs = [], soft = false }) {
  const conversionNudge = ['local-intro', 'commercial-intro', 'guide-purpose'].includes(module)
    ? `<div class="conversion-cta-block" data-generated-cta="mid" data-generated-module="${escapeAttribute(module)}">
  <span class="eyebrow">Check Your Moving Cost</span>
  <h3>Planning a move in Adelaide?</h3>
  <p>Check your moving cost and get a fixed-price quote.</p>
  <div class="cta-cluster">
    <a class="button button-primary" href="/contact-us/#quote-form">Check Your Moving Cost</a>
    <a class="button button-secondary" href="/contact-us/#quote-form">Request a Quote</a>
  </div>
  <div class="cta-reassurance" aria-label="Quote reassurance">
    <p>Fixed pricing - no hidden costs</p>
    <p>Fast response after brief review</p>
    <p>Planned around your actual move details</p>
  </div>
</div>`
    : '';

  return `<section${id ? ` id="${escapeAttribute(id)}"` : ''} class="section${soft ? ' section-soft' : ''}" data-generated-module="${escapeAttribute(module)}">
  <div class="container">
    ${renderSectionHeading(eyebrow, heading, intro)}
    ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    ${conversionNudge}
  </div>
</section>`;
}

function renderValueCardSection({ id = '', module, eyebrow, heading, intro = '', cards = [], soft = false }) {
  return `<section${id ? ` id="${escapeAttribute(id)}"` : ''} class="section${soft ? ' section-soft' : ''}" data-generated-module="${escapeAttribute(module)}">
  <div class="container">
    ${renderSectionHeading(eyebrow, heading, intro)}
    <div class="value-grid">
      ${cards
        .map(
          (card) => `<article class="value-card">
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.copy)}</p>
        ${Array.isArray(card.points) && card.points.length > 0 ? `<ul>${card.points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>` : ''}
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderRouteCardSection({ id = '', module, eyebrow, heading, intro = '', cards = [], soft = false }) {
  return `<section${id ? ` id="${escapeAttribute(id)}"` : ''} class="section${soft ? ' section-soft' : ''}" data-generated-module="${escapeAttribute(module)}">
  <div class="container">
    ${renderSectionHeading(eyebrow, heading, intro)}
    <div class="route-grid">
      ${cards
        .map(
          (card) => `<article class="route-card">
        <small>${escapeHtml(card.eyebrow)}</small>
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.copy)}</p>
        <a class="button-link" href="${escapeAttribute(normalizeInternalHref(card.href))}">${escapeHtml(card.cta)}</a>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderFaqSectionBlock({ id = '', module, eyebrow, heading, intro = '', items = [] }) {
  return `<section${id ? ` id="${escapeAttribute(id)}"` : ''} class="section section-split" data-generated-module="${escapeAttribute(module)}">
  <div class="container">
    ${renderSectionHeading(eyebrow, heading, intro)}
    <div class="faq-list">
      ${items
        .map(
          (item) => `<article class="faq-item">
        <h3 class="faq-question">${escapeHtml(item.question)}</h3>
        <div class="faq-answer">
          <p>${escapeHtml(item.answer)}</p>
        </div>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>`;
}

function renderQuoteStrip({ id = '', eyebrow, heading, copy, primaryCta, secondaryCta, pageType }) {
  return `<section${id ? ` id="${escapeAttribute(id)}"` : ''} class="section" data-generated-module="bottom-cta">
  <div class="container">
    <div class="quote-strip quote-strip-premium">
      <div class="quote-strip-content">
        ${renderSectionHeading(eyebrow, heading, copy)}
        <div class="cta-reassurance" aria-label="Quote reassurance">
          <p>Fixed pricing - no hidden costs</p>
          <p>Fast response after brief review</p>
          <p>Planned around your actual move details</p>
        </div>
      </div>
      <div class="cta-cluster" data-generated-cta="bottom" data-generated-page-type="${escapeAttribute(pageType)}">
        <a class="button button-primary" href="${escapeAttribute(normalizeInternalHref(primaryCta.href))}">${escapeHtml(primaryCta.label)}</a>
        <a class="button button-secondary" href="${escapeAttribute(normalizeInternalHref(secondaryCta.href))}">${escapeHtml(secondaryCta.label)}</a>
        <a class="button button-secondary" href="tel:+61433819989">Call 0433 819 989</a>
      </div>
    </div>
  </div>
</section>`;
}

function renderGuideTocSection({ title, intentProfile = null }) {
  const items = [
    ['#guide-purpose', 'Why this planning topic matters'],
    ['#guide-practical-planning', 'Practical checklist points'],
    ['#guide-service-paths', 'Best-fit service pages'],
    ['#guide-suburb-context', 'Adelaide suburb context'],
    ['#guide-faq', 'Common questions'],
    ['#guide-quote-next-step', 'Quote next step'],
  ];

  return `<section class="section section-soft" data-generated-module="guide-toc" data-seo-v5-toc="true">
  <div class="container">
    ${renderSectionHeading(
      'Guide contents',
      `Plan your next step from ${title}`,
      intentProfile?.searchIntent
        ? `Use this guide for ${intentProfile.searchIntent}, then move into the service, suburb, or quote path that matches the actual move.`
        : 'Use this table of contents to move from planning question to quote-ready brief.',
    )}
    <nav aria-label="Guide contents">
      <ul class="trust-chips">
${items.map(([href, label]) => `        <li><a href="${escapeAttribute(href)}">${escapeHtml(label)}</a></li>`).join('\n')}
      </ul>
    </nav>
  </div>
</section>`;
}

export function getGeneratedPages() {
  const pages = [];

  pages.push(makeStaticPage({
    output: 'seo-v4/overview/index.html',
    title: buildTitle('ZQ SEO V4 Overview'),
    description: buildDescription('Central SEO architecture overview for scalable Adelaide service, suburb, guide, and interstate pages.'),
    canonical: buildCanonical('/seo-v4/overview/'),
    contentHtml: renderOverviewPage(),
    robots: 'noindex,follow',
    extra: true,
  }));

  for (const [slug, suburb, region, clusterKey, logisticsLabel] of suburbData) {
    pages.push(makeSuburbPage({ slug, suburb, region, clusterKey, logisticsLabel }));
  }

  for (const route of interstateRouteData) {
    pages.push(makeInterstateRoutePage(route));
  }

  pages.push(makeRedirectPage({
    output: 'removalists-semore/index.html',
    canonical: buildCanonical('/removalists-semaphore/'),
    title: buildTitle('Semaphore Removalists Redirect'),
    description: buildDescription('Legacy typo redirect for the Semaphore removals page.'),
    destinationPath: '/removalists-semaphore/',
  }));

  for (const [slug, title, topic, type] of guideTopics) {
    pages.push(makeGuidePage({ slug, title, topic, type }));
  }

  for (const page of commercialPages) {
    pages.push(makeCommercialPage(page));
  }

  return pages;
}

const GENERATED_LASTMOD_SOURCES = ['site-src/data/seo-v4.mjs', 'scripts/build-site.mjs'];

function makeStaticPage(page) {
  return {
    output: page.output,
    layout: 'standard',
    generatedKind: page.generatedKind || 'overview',
    title: page.title,
    description: page.description,
    canonical: page.canonical,
    robots: page.robots || seoConfig.robots,
    ogTitle: page.title,
    ogDescription: page.description,
    ogUrl: page.canonical,
    ogImage: DEFAULT_OG_IMAGE,
    twitterTitle: page.title,
    twitterDescription: page.description,
    twitterImage: DEFAULT_OG_IMAGE,
    jsonLd: [JSON.stringify(buildBreadcrumbSchema([{ name: 'Home', url: SITE_URL }], page.canonical))],
    contentHtml: page.contentHtml,
    lastmodSources: page.lastmodSources || GENERATED_LASTMOD_SOURCES,
    extra: page.extra,
  };
}

function makeRedirectPage({ output, canonical, title, description, destinationPath }) {
  return {
    output,
    layout: 'redirect',
    generatedKind: 'redirect',
    title,
    description,
    canonical,
    robots: 'noindex,nofollow',
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: DEFAULT_OG_IMAGE,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: DEFAULT_OG_IMAGE,
    refresh: `0; url=${destinationPath}`,
    lastmodSources: GENERATED_LASTMOD_SOURCES,
    contentHtml: `<main id="main-content"><section class="section"><div class="container"><h1>Redirecting to Semaphore removalists</h1><p><a href="${escapeAttribute(destinationPath)}">Continue to the corrected Semaphore removals page</a>.</p></div></section></main>`,
  };
}

function makeInterstateRoutePage([slug, destination, routeName, distance, highway]) {
  const canonical = buildCanonical(`/${slug}/`);
  const title = buildTitle(`${routeName} Removalists`, 'interstate');
  const description = buildDescription(`Professional ${routeName} removalists. Direct, fixed-price interstate moving from Adelaide to ${destination} (${distance}). Includes full transit protection and experienced crew.`);
  const support = getInterstateSupportProfile(slug);

  return {
    output: `${slug}/index.html`,
    layout: 'standard',
    generatedKind: 'interstate-route',
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: DEFAULT_OG_IMAGE,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: DEFAULT_OG_IMAGE,
    lastmodSources: GENERATED_LASTMOD_SOURCES,
    jsonLd: [
      JSON.stringify(buildLocalBusinessSchema()),
      JSON.stringify(buildServiceSchema({
        id: canonical,
        name: `${routeName} Removals`,
        serviceType: 'Interstate Removals',
        areaServed: ['Adelaide', destination],
        description,
      })),
      JSON.stringify(buildBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Interstate Removals', url: `${SITE_URL}/interstate-removals-adelaide/` },
        { name: routeName, url: canonical },
      ], canonical)),
    ],
    contentHtml: renderInterstateContent({ slug, destination, routeName, distance, highway, support }),
  };
}

function makeSuburbPage({ slug, suburb, region, clusterKey, logisticsLabel }) {
  const canonical = buildCanonical(`/removalists-${slug}/`);
  const normalizedClusterKey = normalizeClusterKey(clusterKey);
  const template = clusterTemplates[normalizedClusterKey] || clusterTemplates.northern;
  const intro = template.intro.replaceAll('{suburb}', suburb);
  const nearby = getSuburbPeerLinks(slug, normalizedClusterKey, template.nearby, 5);

  // Phase 12: Title Variation System
  const titleVariants = ['quote', 'local', 'experts', 'fast'];
  const charCodeSum = suburb.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const variant = titleVariants[charCodeSum % titleVariants.length];

  const title = buildTitle(`${suburb} Removalists`, variant);
  const description = buildDescription(`Professional ${suburb} removalists specializing in ${logisticsLabel}. Get a reliable, fixed-price quote for your ${region} Adelaide house or unit move.`);
  const support = getClusterSupportProfile(normalizedClusterKey);
  const pageImage = getGeneratedPageImage({
    type: 'suburb',
    slug,
    suburb,
    clusterKey: normalizedClusterKey,
    logisticsLabel,
  });
  const faqItems = buildSuburbFaqItems({ suburb, logisticsLabel, nearby, clusterKey: normalizedClusterKey });

  return {
    output: `removalists-${slug}/index.html`,
    layout: 'standard',
    generatedKind: 'suburb',
    title,
    description,
    canonical,
    robots: seoConfig.robots,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: pageImage?.url || DEFAULT_OG_IMAGE,
    ogImageAlt: pageImage?.alt || title,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: pageImage?.url || DEFAULT_OG_IMAGE,
    heroImage: pageImage?.path || '',
    heroImageAlt: pageImage?.alt || '',
    lastmodSources: GENERATED_LASTMOD_SOURCES,
    jsonLd: [
      JSON.stringify(buildLocalBusinessSchema()),
      ...(pageImage
        ? [JSON.stringify(buildImageObjectSchema({
            id: canonical,
            url: pageImage.url,
            name: pageImage.title,
            caption: pageImage.caption,
          }))]
        : []),
      JSON.stringify(buildServiceSchema({
        id: canonical,
        name: `Removalists ${suburb}`,
        serviceType: `Local removals in ${suburb}`,
        areaServed: [suburb, region, ...seoConfig.serviceAreas],
        description,
      })),
      JSON.stringify(buildBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Removalists Adelaide', url: `${SITE_URL}/removalists-adelaide/` },
        { name: `Removalists ${suburb}`, url: canonical },
      ], canonical)),
      JSON.stringify(buildFAQSchema(faqItems, canonical)),
    ],
    contentHtml: renderSuburbContent({
      slug,
      suburb,
      region,
      intro,
      logisticsLabel,
      nearby,
      clusterKey: normalizedClusterKey,
      image: pageImage,
      faqItems,
    }),
  };
}

function makeGuidePage({ slug, title, topic }) {
  const canonical = buildCanonical(`/adelaide-moving-guides/${slug}/`);
  const intentProfile = seoV5GuideProfiles[slug] || null;
  const seoTitle = buildTitle(title, 'brand');
  const description = buildDescription(
    intentProfile
      ? `Adelaide guide for ${intentProfile.searchIntent}. ${intentProfile.uniqueAngle}.`
      : `Expert Adelaide moving guide on ${topic}. Practical advice, planning tips, and local insights for a more organized relocation.`,
  );
  const pageImage = getGeneratedPageImage({ type: 'guide', slug, title, topic });
  return {
    output: `adelaide-moving-guides/${slug}/index.html`,
    layout: 'standard',
    generatedKind: 'guide',
    title: seoTitle,
    description,
    canonical,
    robots: seoConfig.robots,
    ogTitle: seoTitle,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: pageImage?.url || DEFAULT_OG_IMAGE,
    ogImageAlt: pageImage?.alt || title,
    twitterTitle: seoTitle,
    twitterDescription: description,
    twitterImage: pageImage?.url || DEFAULT_OG_IMAGE,
    heroImage: pageImage?.path || '',
    heroImageAlt: pageImage?.alt || '',
    intentProfile,
    lastmodSources: GENERATED_LASTMOD_SOURCES,
    jsonLd: [
      JSON.stringify(buildBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Adelaide Moving Guides', url: `${SITE_URL}/adelaide-moving-guides/` },
        { name: title, url: canonical },
      ], canonical)),
      ...(pageImage
        ? [JSON.stringify(buildImageObjectSchema({
            id: canonical,
            url: pageImage.url,
            name: pageImage.title,
            caption: pageImage.caption,
          }))]
        : []),
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': ['Article', 'BlogPosting'],
        '@id': `${canonical}#article`,
        headline: title,
        description,
        mainEntityOfPage: { '@id': `${canonical}#webpage` },
        author: { '@type': 'Organization', name: BUSINESS_NAME },
        publisher: { '@type': 'Organization', name: BUSINESS_NAME },
        ...(pageImage ? { image: [pageImage.url] } : {}),
      }),
    ],
    contentHtml: renderGuideContent({ slug, title, topic, canonical, image: pageImage }),
  };
}

function makeCommercialPage(page) {
  const canonical = buildCanonical(page.canonical);
  const title = buildTitle(page.title, 'quote');
  const description = buildDescription(`${page.description} High-standards service with clear fixed-price quoting and professional Adelaide-based planning.`);
  const pageImage = getGeneratedPageImage({ type: 'commercial', slug: page.slug, title: page.title });
  const intentProfile = buildCommercialIntentProfile(page);
  return {
    output: `${page.slug}/index.html`,
    layout: 'standard',
    generatedKind: 'commercial',
    title,
    description,
    canonical,
    robots: seoConfig.robots,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: pageImage?.url || DEFAULT_OG_IMAGE,
    ogImageAlt: pageImage?.alt || title,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: pageImage?.url || DEFAULT_OG_IMAGE,
    heroImage: pageImage?.path || '',
    heroImageAlt: pageImage?.alt || '',
    intentProfile,
    lastmodSources: GENERATED_LASTMOD_SOURCES,
    jsonLd: [
      JSON.stringify(buildLocalBusinessSchema()),
      ...(pageImage
        ? [JSON.stringify(buildImageObjectSchema({
            id: canonical,
            url: pageImage.url,
            name: pageImage.title,
            caption: pageImage.caption,
          }))]
        : []),
      JSON.stringify(buildServiceSchema({
        id: canonical,
        name: page.title,
        serviceType: page.title,
        areaServed: ['Adelaide', ...seoConfig.serviceAreas],
        description,
      })),
      JSON.stringify(buildBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: page.title, url: canonical },
      ], canonical)),
      JSON.stringify(buildFAQSchema(page.faq, canonical)),
    ],
    contentHtml: renderCommercialContent(page, canonical, pageImage),
  };
}

function renderOverviewPage() {
  return `<main id="main-content"><section class="section"><div class="container"><h1>ZQ SEO V4</h1><p>Centralised SEO architecture for scalable Adelaide local landing pages, service pages, guides, and automated sitemap generation.</p></div></section></main>`;
}

function buildInterstatePricingCards({ destination, distance, highway }) {
  return [
    {
      title: 'Inventory-Based Volume',
      copy: 'Interstate quotes are primarily driven by the volume of your inventory. We review your list to ensure the truck size and load weight are perfectly matched.',
      points: [
        'Room-by-room inventory review',
        'Large furniture items measured',
        'Transparent cubic-metre estimates',
      ],
    },
    {
      title: 'Access & Logistics',
      copy: `The distance to ${destination} is fixed, but access at both ends can change the plan. We account for everything from service lifts to narrow street positioning.`,
      points: [
        'Loading dock coordination',
        'Stair and long-carry factors',
        'Shuttle vehicle needs identified',
      ],
    },
    {
      title: 'Transit & Protection',
      copy: `For the ${distance} journey via the ${highway}, professional wrapping and transit insurance are standard to ensure your furniture arrives in showroom condition.`,
      points: [
        'Premium furniture blankets',
        'High-grade shrink wrapping',
        'Standard transit insurance included',
      ],
    },
  ];
}

function buildInterstateWindowCards({ destination, distance }) {
  return [
    {
      title: 'Direct Pickup Window',
      copy: 'We provide a specific window for your Adelaide pickup so you can finalize your house clean and key handovers with confidence.',
      points: ['Morning or afternoon windows', 'Pre-arrival crew notifications', 'Organized loading sequence'],
    },
    {
      title: 'Predictable Delivery',
      copy: `Unlike depot-based services, our direct transit to ${destination} means you get a reliable delivery window tailored to the ${distance} route.`,
      points: ['No depot storage delays', 'One crew from start to finish', 'Direct communication with the driver'],
    },
    {
      title: 'Travel Coordination',
      copy: 'We help you plan your own travel to the destination so you arrive ready to meet the truck and begin your new setup.',
      points: ['Key handover timing aligned', 'Settlement gap planning', 'Emergency contact protocols'],
    },
  ];
}

function renderInterstateContent({ slug, destination, routeName, distance, highway, support }) {
  const cta = 'Get a Fixed-Price Quote';
  const pricingCards = buildInterstatePricingCards({ destination, distance, highway });
  const windowCards = buildInterstateWindowCards({ destination, distance });
  const serviceCards = support.services.map((item, index) => ({
    eyebrow: index === 0 ? 'Interstate service' : 'Service fit',
    title: toTitle(item.label),
    copy: `Moving to ${destination} requires ${item.label.toLowerCase()} that accounts for the ${distance} journey and the specific logistics of ${destination} deliveries.`,
    href: item.href,
    cta: item.label,
  }));
  const guideCards = support.guides.map((item, index) => ({
    eyebrow: index === 0 ? 'Interstate planning' : 'Route guide',
    title: toTitle(item.label),
    copy: `Use this guide to prepare for your Adelaide to ${destination} relocation via the ${highway}.`,
    href: item.href,
    cta: item.label,
  }));
  const siblingCards = support.siblings.map((item, index) => ({
    eyebrow: index === 0 ? 'Other route' : 'Related corridor',
    title: item.label,
    copy: `Compare the ${item.label} route if you are weighing different interstate destinations from Adelaide.`,
    href: item.href,
    cta: item.label,
  }));

  return `<main id="main-content" data-generated-page="interstate-v5">
${renderPageHero({
  eyebrow: 'Interstate Removals Adelaide',
  title: `${routeName} removalists for fixed-price, direct relocations`,
  lead: `Moving from Adelaide to ${destination} is ${distance}. We provide a direct, fixed-price interstate service designed for reliability and clear timing.`,
  supporting: [
    `Direct transit via the ${highway} with no double handling and full transit protection.`,
    `A professional ${routeName} move brief should account for inventory depth and specific property access at both ends.`,
  ],
  points: [
    'Direct transit with one truck and one crew',
    'Fixed pricing inclusive of GST and insurance',
    'Route expertise across the major highway networks',
    `Reliable delivery windows for ${destination}`,
  ],
  primaryCta: { href: '/contact-us/#quote-form', label: cta },
  secondaryCta: { href: '/interstate-removals-adelaide/', label: 'View all routes' },
  pageType: 'interstate',
  breadcrumbs: [
    { href: '/', label: 'Home' },
    { href: '/interstate-removals-adelaide/', label: 'Interstate Removals' },
    { label: routeName },
  ],
})}

${renderValueCardSection({
  module: 'interstate-pricing',
  eyebrow: 'Pricing Logic',
  heading: `What affects your ${routeName} move quote`,
  intro: `Interstate pricing depends on a transparent cubic-metre model combined with the specific access detail of your ${destination} route.`,
  cards: pricingCards,
})}

${renderValueCardSection({
  module: 'interstate-windows',
  eyebrow: 'Timing & Logistics',
  heading: `Planning your ${destination} delivery window`,
  intro: `Moving ${distance} requires an organized schedule. We provide clear windows for both pickup and final delivery.`,
  cards: windowCards,
  soft: true,
})}

${renderValueCardSection({
  module: 'interstate-planning',
  eyebrow: 'Route planning',
  heading: `How the ${routeName} route is managed`,
  intro: `Moving interstate requires a practical order of operations. We plan the ${distance} transit to ensure efficiency and safety.`,
  cards: [
    { title: 'Direct Transit Path', copy: 'Your goods stay on the same vehicle from Adelaide pickup to final delivery. No depots, no sub-contractors, no double handling.' },
    { title: 'Fixed-Price Clarity', copy: 'We quote based on your specific inventory and access. The price we provide is fixed, so you can plan your budget with confidence.' },
    { title: 'Highway Logistics', copy: `Our crews are experienced with the ${highway} and the specific delivery conditions in ${destination}, from city towers to suburban streets.` },
  ],
})}
${renderRouteCardSection({
  module: 'related-services',
  eyebrow: 'Service support',
  heading: 'Recommended services for interstate moves',
  intro: 'Long-distance relocations benefit from specialized packing and handling services.',
  cards: serviceCards,
  soft: true,
})}
${renderRouteCardSection({
  module: 'related-guides',
  eyebrow: 'Planning resources',
  heading: `Guides to help your move to ${destination}`,
  intro: 'Review our professional guides to sharpen your planning before the transit day.',
  cards: guideCards,
})}
${renderRouteCardSection({
  module: 'sibling-routes',
  eyebrow: 'Related routes',
  heading: 'Compare other interstate corridors',
  intro: 'These routes are common alternatives when leaving Adelaide for major Australian hubs.',
  cards: siblingCards,
  soft: true,
})}
${renderQuoteStrip({
  eyebrow: 'Request a Quote',
  heading: `Get your fixed-price quote for ${routeName}`,
  copy: `Plan your move to ${destination} with a clear, professional price and reliable transit window.`,
  primaryCta: { href: '/contact-us/#quote-form', label: 'Get Fixed-Price Quote' },
  secondaryCta: { href: '/interstate-removals-adelaide/', label: 'View All Routes' },
  pageType: 'interstate',
})}
</main>`;
}

function buildSuburbComplexityCards({ suburb, logisticsLabel, clusterKey }) {
  const traits = buildSuburbTraits(logisticsLabel, clusterKey);
  return [
    {
      title: 'Property Mix & Access',
      copy: `Quotes for ${suburb} relocations often change based on whether the home is a standard residential block, a modern unit, or a multi-storey townhouse.`,
      points: [
        traits.includes('apartment') ? 'Lift booking and dock windows are high-priority' : 'Driveway width and clearance should be noted',
        traits.includes('heritage') ? 'Tighter entries require more careful furniture flow' : 'Carry distance from truck to entry affects labour timing',
        'Stairs and multi-level floorplans change the staging order',
      ],
    },
    {
      title: 'Inventory & Protection',
      copy: 'The volume of furniture is only one part of the quote. The number of fragile pieces and the overall protection level needed for the transit also shape the plan.',
      points: [
        'Carton counts and packing status confirmed early',
        'Large furniture or heavy gym gear listed in the brief',
        'High-value or delicate finishes identified for wrapping',
      ],
    },
    {
      title: 'Route & Timing Factors',
      copy: `Moving in the ${suburb} area means coordinating with local traffic patterns and parking restrictions that can influence the overall move window.`,
      points: [
        'Peak hour windows avoided to keep timing predictable',
        'Loading zones or street parking permits checked early',
        'Multi-stop routes or storage drop-offs planned in sequence',
      ],
    },
  ];
}

function renderSuburbContent({ slug, suburb, region, intro, logisticsLabel, nearby, clusterKey, image, faqItems }) {
  const cta = getSuburbCtaTheme(clusterKey);
  const supportProfile = getClusterSupportProfile(clusterKey);
  const startHere = getSuburbStartHere(slug);
  const complexityCards = buildSuburbComplexityCards({ suburb, logisticsLabel, clusterKey });
  const introParagraphs = buildSuburbIntroParagraphs({ suburb, intro, logisticsLabel, nearby, clusterKey, supportProfile });
  const nearbyCards = nearby.map((item, index) => ({
    eyebrow: index === 0 ? 'Nearby suburb' : 'Compare the route',
    title: item.suburb,
    copy: `Researching removalists in ${item.suburb} often yields similar logistics to ${suburb} due to their proximity and shared property styles.`,
    href: item.href,
    cta: item.label,
  }));
  const coreServiceLinks = [
    { href: '/house-removals-adelaide/', label: 'house removals Adelaide' },
    { href: '/furniture-removalists-adelaide/', label: 'furniture removalists Adelaide' },
    { href: '/office-removals-adelaide/', label: 'office removals Adelaide' },
    { href: '/packing-services-adelaide/', label: 'packing services Adelaide' },
    { href: '/interstate-removals-adelaide/', label: 'interstate removals Adelaide' },
  ];
  const serviceCards = [...supportProfile.services, ...coreServiceLinks]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index)
    .slice(0, 5)
    .map((item, index) => ({
    eyebrow: index === 0 ? 'Related service' : 'Service fit',
    title: toTitle(item.label),
    copy: `${item.label} stays relevant for ${suburb} because the move brief can still shift toward ${region.toLowerCase()} household work, packing, furniture handling, or a broader Adelaide route.`,
    href: item.href,
    cta: item.label,
  }));
  const guideCards = [
    { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
    ...supportProfile.guides,
  ]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index)
    .slice(0, 2)
    .map((item, index) => ({
    eyebrow: index === 0 ? 'Planning guide' : 'Guide support',
    title: toTitle(item.label),
    copy: `Use this guide for access, timing, or quote preparation before booking.`,
    href: item.href,
    cta: item.label,
  }));
  const regionalHub = clusterKey.includes('southern')
    ? { href: '/removalists-southern-adelaide/', label: 'Southern Adelaide service hub' }
    : clusterKey.includes('northern')
      ? { href: '/removalists-northern-adelaide/', label: 'Northern Adelaide service hub' }
      : supportProfile.hubs[0] || { href: '/removalists-adelaide/', label: 'Review Adelaide removals' };

  return `<main id="main-content" data-generated-page="suburb-v5">
${renderPageHero({
  eyebrow: `Removalists ${suburb}`,
  title: `${suburb} removalists for ${logisticsLabel} and clearer Adelaide route planning`,
  lead: `${suburb} moves work best when the route, the access pattern, and the inventory mix are reviewed together before the quote is approved.`,
  supporting: [
    `${suburb} sits inside the ${formatClusterLabel(clusterKey).toLowerCase()} cluster, so the booking path should reflect local access pressure rather than a generic metro assumption.`,
  ],
  points: buildSuburbHighlights({ suburb, logisticsLabel, clusterKey, nearby }),
  primaryCta: { href: '/contact-us/#quote-form', label: cta },
  secondaryCta: { href: '/removalists-adelaide/', label: 'View Adelaide coverage' },
  image,
  breadcrumbs: [
    { href: '/', label: 'Home' },
    { href: '/removalists-adelaide/', label: 'Removalists Adelaide' },
    { label: suburb },
  ],
  pageType: 'suburb',
})}
${renderTextSection({
  module: 'local-intro',
  eyebrow: 'Local suburb brief',
  heading: `${cta} for ${suburb} without losing the route detail`,
  intro: `This page is built to turn ${suburb} research into a stronger quote-ready brief.`,
  paragraphs: introParagraphs.slice(0, 1),
})}
${renderValueCardSection({
  module: 'local-service-summary',
  eyebrow: 'Local service summary',
  heading: `How ${suburb} jobs are scoped before move day`,
  intro: `The quote should reflect local access, route timing, and the service type that best fits the move.`,
  cards: buildSuburbSummaryCards({ suburb, logisticsLabel, supportProfile, traits: buildSuburbTraits(logisticsLabel, clusterKey) }).slice(0, 1),
})}
${renderValueCardSection({
  module: 'logistics-access',
  eyebrow: 'Logistics and access',
  heading: `What usually changes the timing in ${suburb}`,
  intro: `Access notes, parking, and the order of operations matter more than the suburb name alone.`,
  cards: buildSuburbLogisticsCards({ suburb, logisticsLabel, clusterKey, nearby }).slice(0, 1),
})}
${renderTextSection({
  module: 'local-insights',
  eyebrow: 'Local insights',
  heading: `Parking, property type, and traffic notes for ${suburb}`,
  intro: `${suburb} needs its own move plan because parking, apartments, houses, and timing pressure change the way the job should be staffed.`,
  paragraphs: [
    `Parking in ${suburb} should be treated as an access variable. Driveways, kerbside stopping, loading zones, shared frontage, visitor bays, and longer carries can all change timing, so those notes belong in the quote request.`,
    `Apartment and townhouse moves usually need service lifts, stairs, corridor, and loading-area notes, while house moves depend more on volume, garage stock, outdoor items, and room order. Traffic can shift with school periods, shopping strips, commute windows, and coastal or corridor demand.`,
  ],
})}
${renderValueCardSection({
  module: 'move-types',
  eyebrow: 'Move types',
  heading: `Common move briefs we support in ${suburb}`,
  intro: `Different route patterns call for different service emphasis, even inside the same suburb.`,
  cards: buildSuburbMoveTypeCards({ suburb, logisticsLabel, clusterKey }).slice(0, 1),
  soft: true,
})}
${renderRouteCardSection({
  module: 'nearby-suburbs',
  eyebrow: 'Nearby suburbs',
  heading: `Compare ${suburb} with the most relevant nearby routes`,
  intro: `These nearby pages help when the booking covers multiple local areas or the suburb choice is still being narrowed.`,
  cards: nearbyCards,
})}
${renderRouteCardSection({
  module: 'related-services',
  eyebrow: 'Related services',
  heading: `Best-fit service pages for ${suburb} searches`,
  intro: `Suburb traffic should still flow naturally into the service page that matches the actual move.`,
  cards: serviceCards,
  soft: true,
})}
${renderRouteCardSection({
  module: 'related-guides',
  eyebrow: 'Related guides',
  heading: `Planning guides that help ${suburb} visitors convert`,
  intro: `These guides answer the pre-quote questions that usually sit between research and booking approval.`,
  cards: guideCards.slice(0, 3),
})}
${renderValueCardSection({
  module: 'trust',
  eyebrow: 'Trust and planning',
  heading: `Why ${suburb} clients should choose a scoped move plan`,
  intro: `The trust signal on a suburb page should be practical: clear communication, careful handling, and a quote based on the real access conditions.`,
  cards: [
    {
      title: 'Experienced Adelaide movers',
      copy: `The team plans ${suburb} work around route, property type, parking, and item list.`,
    },
    {
      title: 'Careful furniture handling',
      copy: `Furniture, whitegoods, and fragile pieces are easier to protect when access is listed early.`,
    },
  ],
  soft: true,
})}
${renderFaqSectionBlock({
  module: 'suburb-faq',
  eyebrow: 'Local FAQ',
  heading: `Questions people ask before booking ${suburb} removalists`,
  intro: `These answers stay aligned with the visible access and route themes on this page.`,
  items: faqItems.slice(0, 5),
})}
${renderQuoteStrip({
  eyebrow: 'Ready to move',
  heading: `Send the ${suburb} route and we will scope it properly`,
  copy: `Include the origin, destination, property type, and any access notes so the quote reflects the real move rather than a thin suburb estimate.`,
  primaryCta: { href: '/contact-us/#quote-form', label: 'Get Fixed-Price Quote' },
  secondaryCta: regionalHub,
  pageType: 'suburb',
})}
</main>`;
}

function renderGuideContent({ slug, title, topic, canonical, image }) {
  const support = getGuideSupportProfile(slug);
  const profile = guideLinkProfiles[slug] || guideLinkProfiles['moving-checklist-adelaide'];
  const intentProfile = seoV5GuideProfiles[slug] || null;
  const extras = {
    'storage planning': 'Include storage unit access, staging order, and whether the load needs a short-term stop before final delivery.',
    'booking timing': 'Weekdays can be easier to book, while weekend demand usually needs a longer lead time.',
    'packing tips': 'Packing services Adelaide can help when fragile items or a full-room pack needs a cleaner sequence.',
    'apartment moves': 'Apartment lifts, loading windows, and building rules should be confirmed before move day.',
    'office preparation': 'Office relocations need restart timing, dock access, and staff coordination.',
    'suburb move prep': 'Suburb move prep works best when the access brief, inventory, and quote target are all aligned.',
    'cost guide': 'Removalists Adelaide pricing depends on access, inventory, stairs, and timing windows.',
    'moving checklist': 'This moving checklist helps Adelaide customers confirm the brief before booking.',
  };
  const serviceLinks = ensureLinkDepth(support.services, seoV5DefaultServiceLinks, 4);
  const suburbLinks = ensureLinkDepth(profile.suburbs, [...(support.hubs || []), ...seoV5DefaultSuburbLinks], 5);
  const guideLinks = ensureLinkDepth(
    profile.guides,
    seoV5DefaultGuideLinks.filter((item) => item.href !== `/adelaide-moving-guides/${slug}/`),
    4,
  );
  const serviceCards = serviceLinks.map((item, index) => ({
    eyebrow: index === 0 ? 'Service hub' : 'Service fit',
    title: toTitle(item.label),
    copy: `Use this service hub when your ${topic} research is ready to turn into a specific move brief.`,
    href: item.href,
    cta: item.label,
  }));
  const suburbCards = suburbLinks.map((item, index) => ({
    eyebrow: index === 0 ? 'Local route' : 'Suburb planning',
    title: toTitle(item.label),
    copy: `This suburb page provides route-specific context for ${topic} within a local Adelaide corridor.`,
    href: item.href,
    cta: item.label,
  }));
  const guideCards = guideLinks.map((item, index) => ({
    eyebrow: index === 0 ? 'Next step' : 'Related planning',
    title: toTitle(item.label),
    copy: `Review this related resource to sharpen another part of your move plan before you book.`,
    href: item.href,
    cta: item.label,
  }));
  const adviceCards = buildGuideAdviceCards(topic, slug);
  const faqItems = buildGuideFaqItems({ title, topic, slug });

  return `<main id="main-content" data-generated-page="guide-v5" data-seo-v5-intent-profile="${escapeAttribute(intentProfile?.primaryKeyword || topic)}">
${renderPageHero({
  eyebrow: 'Adelaide moving guide',
  title,
  lead: `This guide covers ${topic} for Adelaide customers who need a more useful brief before the quote is confirmed.`,
  supporting: [
    intentProfile?.uniqueAngle || extras[topic] || 'Use this page to tighten the move brief before requesting a quote.',
    'Strong guide pages should answer the planning question and move the visitor toward the best-fit commercial or suburb page.',
  ],
  points: [
    'Practical Adelaide planning notes without filler',
    'Natural links into service pages, suburbs, and quote paths',
    'Written to support real pre-booking questions',
  ],
  primaryCta: { href: '/contact-us/#quote-form', label: 'Get Fixed-Price Quote' },
  secondaryCta: { href: '/adelaide-moving-guides/', label: 'Back to moving guides' },
  image,
  breadcrumbs: [
    { href: '/', label: 'Home' },
    { href: '/adelaide-moving-guides/', label: 'Adelaide Moving Guides' },
    { label: title },
  ],
  pageType: 'guide',
})}
${renderGuideTocSection({ title, intentProfile })}
${renderTextSection({
  id: 'guide-purpose',
  module: 'guide-purpose',
  eyebrow: 'Guide purpose',
  heading: `Why ${topic} matters before the moving date is locked`,
  intro: `The best guide pages improve the move brief before the visitor reaches the contact form.`,
  paragraphs: [
    `People usually arrive on a guide like ${title} because one part of the move still feels uncertain. That could be pricing, access, packing, timing, or whether the suburb page alone is enough to shape the quote.`,
    `A stronger answer does not stop at advice. It should push the visitor toward the most relevant Adelaide service page, local route page, or high-intent money page once the question is clear enough to act on.`,
  ],
})}
${renderValueCardSection({
  id: 'guide-practical-planning',
  module: 'guide-deep-advice',
  eyebrow: 'Practical planning',
  heading: `How to apply this ${topic} advice before requesting a quote`,
  intro: `Use these points to turn general research into a clear Adelaide move brief.`,
  cards: adviceCards,
  soft: true,
})}
${['cost guide', 'accurate moving quotes', 'cheap vs fixed price removals'].includes(topic) ? renderQuoteModelComparison({ module: 'guide-quote-model-comparison' }) : ''}

${renderRouteCardSection({
  id: 'guide-service-paths',
  module: 'guide-services',
  eyebrow: 'Service Paths',
  heading: `Recommended service hubs for ${topic}`,
  intro: `Once you have reviewed the planning points for ${topic}, these service pages help you finalize the brief.`,
  cards: serviceCards,
})}

${renderRouteCardSection({
  id: 'guide-suburb-context',
  module: 'guide-suburbs',
  eyebrow: 'Local Context',
  heading: `Applying ${topic} to your specific Adelaide route`,
  intro: `Local access conditions can change how ${topic} is managed. Compare these suburb-specific entry points.`,
  cards: suburbCards,
  soft: true,
})}

${renderRouteCardSection({
  id: 'guide-related-resources',
  module: 'guide-related',
  eyebrow: 'Keep planning',
  heading: 'Related guides that move the brief forward',
  intro: 'These pages help when the route still needs one more step of planning before the enquiry is sent.',
  cards: guideCards,
})}
${renderFaqSectionBlock({
  id: 'guide-faq',
  module: 'guide-faq',
  eyebrow: 'Guide FAQ',
  heading: `Questions people ask about ${topic} in Adelaide`,
  intro: `These answers connect the planning topic back to a quote-ready Adelaide move brief.`,
  items: faqItems,
})}

${renderQuoteStrip({
  id: 'guide-quote-next-step',
  eyebrow: 'Plan confirmed',
  heading: `Request your quote based on your ${topic} brief`,
  copy: `Ready to book? Send your move details and we will provide a clear, fixed-price quote.`,
  primaryCta: { href: '/contact-us/#quote-form', label: 'Get Fixed-Price Quote' },
  secondaryCta: { href: '/adelaide-moving-guides/', label: 'All Guides' },
  pageType: 'guide',
})}
</main>`;
}

function renderQuoteModelComparison({ module = 'quote-model-comparison', soft = false } = {}) {
  return `<section class="section${soft ? ' section-soft' : ''}" data-generated-module="${escapeAttribute(module)}">
  <div class="container">
    ${renderSectionHeading(
      'Quote comparison',
      'Hourly rates vs fixed-price moving quotes',
      'Both quote models can be legitimate, but they create different risks when access, inventory, or timing is unclear.',
    )}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Quote model</th>
            <th scope="col">How it works</th>
            <th scope="col">Best fit</th>
            <th scope="col">Main risk</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Hourly removalist quote</th>
            <td>Charged by time, usually influenced by movers, truck size, access, travel, and delays.</td>
            <td>Simple moves where the inventory and access are genuinely predictable.</td>
            <td>Stairs, lifts, traffic, parking, or extra items can push the final cost higher.</td>
          </tr>
          <tr>
            <th scope="row">Fixed-price moving quote</th>
            <td>Quoted from the route, inventory, property access, timing, packing, and handling brief.</td>
            <td>Customers who want cost control before booking and fewer hourly surprises.</td>
            <td>The quote only stays accurate when the supplied move details are accurate.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>`;
}

function buildGuideAdviceCards(topic, slug = '') {
  const v5Cards = {
    'moving-cost-adelaide-2026': [
      {
        title: 'Separate quote factors from headline rates',
        copy: 'Access, stairs, lifts, parking, truck positioning, inventory volume, and packing scope usually matter more than a generic advertised price.',
      },
      {
        title: 'Ask what is included before comparing',
        copy: 'Travel, fuel, furniture blankets, insurance context, extra stops, heavy items, and after-hours timing should be clear before the quote is accepted.',
      },
      {
        title: 'Use fixed pricing when scope is clear',
        copy: 'A fixed-price quote can reduce hourly surprises when the route, property access, and inventory list are accurate.',
      },
      {
        title: 'Send evidence that reduces guesswork',
        copy: 'Photos, room counts, heavy-item notes, and building access rules help the quote reflect the actual Adelaide move rather than a broad estimate.',
      },
    ],
    'how-to-choose-removalists-adelaide': [
      {
        title: 'Check how the quote is scoped',
        copy: 'A reliable Adelaide removalist should ask about access, inventory, parking, stairs, lifts, route timing, and packing before confirming the move.',
      },
      {
        title: 'Look for practical service fit',
        copy: 'House, furniture, office, apartment, interstate, and packing work each need different planning, so choose the page and team that fit the real brief.',
      },
      {
        title: 'Avoid vague promises',
        copy: 'Unsupported guarantees, hidden fees, or unclear hourly inclusions are weaker than a written scope and a clear quote process.',
      },
      {
        title: 'Use local route knowledge',
        copy: 'CBD, coastal, northern, southern, eastern, and hills routes can all change parking, access, and timing assumptions.',
      },
    ],
    'fixed-price-vs-hourly-removalists-adelaide': [
      {
        title: 'Understand what hourly billing exposes',
        copy: 'Traffic, lifts, stairs, parking, long carries, and extra inventory can extend an hourly move if the scope is not clear.',
      },
      {
        title: 'Use fixed pricing for certainty',
        copy: 'A fixed-price quote works best when both addresses, access details, inventory, packing, and timing are reviewed before booking.',
      },
      {
        title: 'Match the model to the risk',
        copy: 'Simple moves may suit hourly pricing, while access-sensitive or deadline-driven moves often benefit from quote-first certainty.',
      },
      {
        title: 'Keep the supplied brief accurate',
        copy: 'Fixed pricing depends on the supplied inventory and access matching the actual job on move day.',
      },
    ],
    'apartment-moving-checklist-adelaide': [
      {
        title: 'Confirm building rules first',
        copy: 'Service-lift bookings, loading dock rules, strata requirements, corridor protection, and move windows should be confirmed before the truck is scheduled.',
      },
      {
        title: 'Map the path from door to truck',
        copy: 'Corridors, stairs, lift size, parking distance, and shared entries can change labour more than the apartment size alone.',
      },
      {
        title: 'List bulky and fragile items separately',
        copy: 'Sofas, beds, mirrors, glass, appliances, and heavy items need more accurate dimensions and handling notes.',
      },
      {
        title: 'Prepare for timed loading',
        copy: 'Apartment windows are easier to keep when cartons are ready, lift access is booked, and priority rooms are sequenced.',
      },
    ],
    'packing-fragile-items-adelaide': [
      {
        title: 'Group fragile items by risk',
        copy: 'Glassware, mirrors, artwork, electronics, marble, lamps, and delicate furniture each need different wrapping and carton choices.',
      },
      {
        title: 'Avoid mixed heavy and fragile cartons',
        copy: 'Fragile boxes should stay manageable, labelled, and protected from weight pressure during stacking and loading.',
      },
      {
        title: 'Plan the load order early',
        copy: 'Fragile cartons and delicate furniture should be staged so they are not trapped under heavy or awkward items.',
      },
      {
        title: 'Use packing support when timing is compressed',
        copy: 'Professional packing can reduce move-day risk when there are many fragile items or a short preparation window.',
      },
    ],
    'last-minute-moving-adelaide': [
      {
        title: 'Call early and keep the brief complete',
        copy: 'Same-day or short-notice availability depends on crew schedule, route, inventory, access, and whether packing is needed.',
      },
      {
        title: 'Prioritise access details',
        copy: 'Parking, stairs, lifts, loading zones, and keys should be clarified first because they decide whether the urgent move is workable.',
      },
      {
        title: 'Separate must-move items',
        copy: 'When time is tight, identify essential furniture, whitegoods, boxes, documents, and fragile items before optional items.',
      },
      {
        title: 'Keep urgency factual',
        copy: 'Short-notice moves should be assessed subject to availability rather than promised without route and inventory review.',
      },
    ],
    'removalist-quote-checklist-adelaide': [
      {
        title: 'Start with the route and property types',
        copy: 'Pickup suburb, delivery suburb, apartment or house type, building rules, and preferred date create the base quote context.',
      },
      {
        title: 'List inventory in useful groups',
        copy: 'Room count, large furniture, whitegoods, fragile pieces, garage stock, outdoor items, and office equipment should be separated.',
      },
      {
        title: 'Record access constraints',
        copy: 'Stairs, lifts, loading docks, parking, carry distance, narrow entries, and heavy items can all change labour and timing.',
      },
      {
        title: 'Add packing and timing needs',
        copy: 'Packing support, settlement windows, after-hours access, storage stops, and delivery restrictions should be included before approval.',
      },
    ],
  };

  return v5Cards[slug] || [
    {
      title: 'Confirm access before comparing prices',
      copy: `Parking, stairs, lifts, loading zones, and carry distance all change how the move should be staffed and scheduled.`,
    },
    {
      title: 'Separate must-move items from nice-to-move items',
      copy: `Heavy furniture, fragile pieces, office equipment, outdoor items, and storage stock should be listed separately.`,
    },
    {
      title: 'Choose the right service path',
      copy: `Use the house, furniture, office, or interstate page that best matches the main risk in the move.`,
    },
    {
      title: 'Build a realistic booking window',
      copy: `Settlement timing, building rules, school traffic, coastal demand, and month-end pressure can all affect timing.`,
    },
  ];
}

function buildGuideFaqItems({ title, topic, slug = '' }) {
  const intentProfile = seoV5GuideProfiles[slug];
  const firstAnswer = intentProfile
    ? `It supports ${intentProfile.searchIntent} by clarifying ${intentProfile.uniqueAngle}. Include access, inventory, property type, parking, stairs, lifts, and any packing or timing requirements in the quote brief.`
    : `It helps you provide the details that change labour and timing: access, inventory, property type, parking, stairs, lifts, and whether packing or storage is part of the move.`;

  return [
    {
      question: `How does this ${topic} guide help me get a better quote?`,
      answer: firstAnswer,
    },
    {
      question: `Should I use this guide before contacting ZQ Removals?`,
      answer: `Yes. You can use ${title} to tighten the brief first, then send the key details through the quote form or call if the move is urgent.`,
    },
    {
      question: `What service page should I read after this ${topic} guide?`,
      answer: `Use the service page that matches the main risk in the move: house removals for residential jobs, furniture removals for bulky pieces, office removals for business moves, or interstate removals for long-distance routes.`,
    },
    {
      question: `Do Adelaide suburb conditions change this advice?`,
      answer: `Yes. CBD, coastal, northern, southern, eastern, and hills suburbs can all create different access, parking, and timing issues, so local suburb pages are useful once the route is known.`,
    },
    {
      question: `Can I request a fixed-price quote after using this guide?`,
      answer: `Yes. Include the addresses, property types, move date, access notes, large items, and any packing needs so the quote can be scoped around the actual move.`,
    },
  ];
}

function renderCommercialContent(page, canonical, image) {
  const profile = commercialLinkProfiles[page.slug] || commercialLinkProfiles['cheap-removalists-adelaide'];
  const intentProfile = buildCommercialIntentProfile(page);
  const serviceLinks = ensureLinkDepth(profile.services, seoV5DefaultServiceLinks, 5);
  const suburbLinks = ensureLinkDepth(profile.suburbs, seoV5DefaultSuburbLinks, 6);
  const guideLinks = ensureLinkDepth(profile.guides, seoV5DefaultGuideLinks, 4);
  const siblingLinks = ensureLinkDepth(profile.siblings, seoV5DefaultServiceLinks, 4);
  const serviceCards = serviceLinks.map((item, index) => ({
    eyebrow: index === 0 ? 'Core service' : 'Related service',
    title: toTitle(item.label),
    copy: `Use this service page when the ${page.title.toLowerCase()} search still overlaps with a more standard Adelaide move path.`,
    href: item.href,
    cta: item.label,
  }));
  const suburbCards = suburbLinks.map((item, index) => ({
    eyebrow: index === 0 ? 'Suburb route' : 'Route trigger',
    title: toTitle(item.label),
    copy: `This suburb route often triggers the same search intent because the local access pattern pushes the move toward ${page.title.toLowerCase()}.`,
    href: item.href,
    cta: item.label,
  }));
  const guideCards = guideLinks.map((item, index) => ({
    eyebrow: index === 0 ? 'Planning guide' : 'Guide support',
    title: toTitle(item.label),
    copy: `Use this guide when the enquiry still needs more planning detail before the service can be priced cleanly.`,
    href: item.href,
    cta: item.label,
  }));
  const siblingCards = siblingLinks.map((item, index) => ({
    eyebrow: index === 0 ? 'Related intent' : 'Sibling page',
    title: toTitle(item.label),
    copy: `This related page helps when the search intent broadens or narrows after the first quote review.`,
    href: item.href,
    cta: item.label,
  }));

  return `<main id="main-content" data-generated-page="money-v5" data-seo-v5-intent-profile="${escapeAttribute(intentProfile.primaryKeyword)}">
${renderPageHero({
  eyebrow: 'Adelaide money page',
  title: page.title,
  lead: page.hero,
  supporting: [
    page.sections[0],
    page.sections[1],
  ],
  points: buildCommercialHighlights(page),
  primaryCta: { href: '/contact-us/#quote-form', label: 'Get Fixed-Price Quote' },
  secondaryCta: { href: '/removalists-adelaide/', label: 'Review Adelaide removals' },
  image,
  breadcrumbs: [
    { href: '/', label: 'Home' },
    { label: page.title },
  ],
  pageType: 'money',
})}
${renderValueCardSection({
  module: 'commercial-intent-profile',
  eyebrow: 'SEO V5 intent',
  heading: `${intentProfile.primaryKeyword} has a distinct job on this site`,
  intro: intentProfile.searchIntent,
  cards: [
    {
      title: 'Unique angle',
      copy: intentProfile.uniqueAngle,
    },
    {
      title: 'Conversion path',
      copy: `${intentProfile.conversionCTA}: send the route, access, inventory, timing, and packing details so the quote reflects the real job.`,
    },
    {
      title: 'Related search language',
      copy: intentProfile.secondaryKeywords.length > 0
        ? intentProfile.secondaryKeywords.join(', ')
        : 'Adelaide removalist quote, local moving service, fixed-price planning.',
    },
  ],
  soft: true,
})}
${renderTextSection({
  module: 'commercial-intro',
  eyebrow: 'Commercial intent',
  heading: `When ${page.title.toLowerCase()} is the right starting point`,
  intro: 'This page should convert high-intent traffic without dropping into doorway-style filler.',
  paragraphs: page.sections,
})}
${renderValueCardSection({
  module: 'commercial-factors',
  eyebrow: 'What changes the quote',
  heading: 'The main factors that shape this service',
  intro: 'The most valuable money pages explain what makes the route simpler or more complex before the visitor submits the enquiry.',
  cards: buildCommercialFactorCards(page),
  soft: true,
})}
${['cheap-removalists-adelaide', 'affordable-removalists-adelaide', 'removalist-cost-adelaide', 'moving-quotes-adelaide', 'fixed-price-removalists-adelaide', 'budget-removalists-adelaide'].includes(page.slug) ? renderQuoteModelComparison({ module: 'commercial-quote-model-comparison' }) : ''}
${renderRouteCardSection({
  module: 'commercial-services',
  eyebrow: 'Related services',
  heading: 'Service pages that connect naturally to this search',
  intro: 'These links keep the visitor inside the service cluster instead of forcing them back to the homepage.',
  cards: serviceCards,
})}
${renderRouteCardSection({
  module: 'commercial-suburbs',
  eyebrow: 'Relevant suburbs',
  heading: 'Suburb routes that often trigger this intent',
  intro: 'These suburb pages are useful when the visitor already knows the local area involved in the move.',
  cards: suburbCards,
  soft: true,
})}
${renderRouteCardSection({
  module: 'commercial-guides',
  eyebrow: 'Planning guides',
  heading: 'Guides that support conversion for this service',
  intro: 'Guide links should answer the next planning question instead of repeating the same pitch.',
  cards: guideCards,
})}
${renderRouteCardSection({
  module: 'commercial-siblings',
  eyebrow: 'Related money pages',
  heading: 'Other high-intent pages that fit nearby search patterns',
  intro: 'These related pages help when the visitor is comparing urgency, access type, or route structure.',
  cards: siblingCards,
  soft: true,
})}
${renderFaqSectionBlock({
  module: 'commercial-faq',
  eyebrow: 'Questions',
  heading: `Questions people ask about ${page.title.toLowerCase()}`,
  intro: 'The answers stay aligned with the visible content and the actual service angle of this page.',
  items: page.faq,
})}
${renderQuoteStrip({
  eyebrow: 'Ready to book',
  heading: `Send the details for ${page.title.toLowerCase()}`,
  copy: 'Include the addresses, property type, preferred timing, and access notes so the service can be scoped without filler or guesswork.',
  primaryCta: { href: '/contact-us/#quote-form', label: 'Get Fixed-Price Quote' },
  secondaryCta: { href: '/removalists-adelaide/', label: 'Review Adelaide removals' },
  pageType: 'money',
})}
</main>`;
}

function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function toTitle(value) {
  return String(value || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function renderLinkListItems(items = []) {
  return items
    .map((item) => `<li><a href="${escapeAttribute(normalizeInternalHref(item.href))}">${item.label}</a></li>`)
    .join('');
}

function getSuburbPeerLinks(slug, clusterKey, templateNearby = [], limit = 4) {
  const normalizedClusterKey = normalizeClusterKey(clusterKey);
  const members = suburbsByClusterKey.get(normalizedClusterKey) || [];
  const currentIndex = members.findIndex((item) => item.slug === slug);
  const slugs = [];

  if (currentIndex >= 0 && members.length > 1) {
    for (const offset of [1, -1, 2, -2, 3, -3]) {
      const member = members[(currentIndex + offset + members.length) % members.length];
      if (member?.slug && member.slug !== slug) {
        slugs.push(member.slug);
      }
    }
  }

  for (const name of templateNearby) {
    const match = suburbDataByName.get(name);
    if (match && match.slug !== slug) {
      slugs.push(match.slug);
    }
  }

  for (const fallbackSlug of ['north-adelaide', 'prospect', 'norwood', 'glenelg', 'marion', 'mawson-lakes', 'salisbury', 'modbury', 'henley-beach']) {
    if (fallbackSlug !== slug) {
      slugs.push(fallbackSlug);
    }
  }

  return [...new Set(slugs)]
    .slice(0, limit)
    .map((peerSlug, index) => {
      const suburb = suburbDataBySlug.get(peerSlug);
      return {
        href: `/removalists-${peerSlug}/`,
        label: getSuburbLinkLabel(suburb?.suburb || toTitle(peerSlug), index),
        suburb: suburb?.suburb || toTitle(peerSlug),
      };
    });
}

function getSuburbLinkLabel(suburb, index) {
  const variants = [
    `${suburb} removals`,
    `moving support in ${suburb}`,
    `${suburb} move planning`,
    `see ${suburb} suburb details`,
    `removalists near ${suburb}`,
    `${suburb} local logistics`,
    `planning a ${suburb} relocation`,
    `${suburb} house move quotes`,
  ];
  return variants[index % variants.length];
}

function getClusterSupportProfile(clusterKey) {
  const normalizedClusterKey = normalizeClusterKey(clusterKey);

  if (['CBD', 'CBD fringe', 'inner east', 'eastern', 'eastern hills', 'north-adelaide'].includes(normalizedClusterKey)) {
    return {
      hubs: [
        { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD removals hub' },
        { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
        { href: '/removalists-north-adelaide/', label: 'North Adelaide service hub' },
      ],
      services: [
        { href: '/apartment-removalists-adelaide/', label: 'apartment removalists for city towers' },
        { href: '/office-relocation-adelaide/', label: 'office relocation planning' },
        { href: '/packing-services-adelaide/', label: 'packing and protection services' },
        { href: '/interstate-removals-adelaide/', label: 'interstate removals from CBD' },
      ],
      guides: [
        { href: '/adelaide-moving-guides/apartment-moving-tips-adelaide/', label: 'apartment moving tips' },
        { href: '/adelaide-moving-guides/apartment-lift-bookings-adelaide/', label: 'apartment lift booking guide' },
        { href: '/adelaide-moving-guides/office-access-planning-adelaide-cbd/', label: 'CBD office access guide' },
        { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'Adelaide removalist cost guide' },
      ],
    };
  }

  if (['coastal', 'southern coastal'].includes(normalizedClusterKey)) {
    return {
      hubs: [
        { href: '/removalists-glenelg/', label: 'Glenelg local service hub' },
        { href: '/removalists-southern-adelaide/', label: 'southern Adelaide coastal hub' },
        { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      ],
      services: [
        { href: '/house-removals-adelaide/', label: 'house removals for coastal homes' },
        { href: '/furniture-removalists-adelaide/', label: 'specialist furniture handling' },
        { href: '/storage-friendly-removals-adelaide/', label: 'storage-friendly removals' },
        { href: '/interstate-removals-adelaide/', label: 'interstate removals coastal' },
      ],
      guides: [
        { href: '/adelaide-moving-guides/coastal-moving-access-adelaide/', label: 'coastal moving access guide' },
        { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
        { href: '/adelaide-moving-guides/storage-planning-adelaide/', label: 'storage planning guide' },
      ],
    };
  }

  if (['southern', 'south-west', 'inner south', 'hills'].includes(normalizedClusterKey)) {
    return {
      hubs: [
        { href: '/removalists-southern-adelaide/', label: 'southern Adelaide removals hub' },
        { href: '/removalists-marion/', label: 'Marion service hub' },
        { href: '/removalists-morphett-vale/', label: 'Morphett Vale removalists' },
      ],
      services: [
        { href: '/house-removals-adelaide/', label: 'family home house removals' },
        { href: '/packing-services-adelaide/', label: 'packing support for larger homes' },
        { href: '/storage-friendly-removals-adelaide/', label: 'storage-aware removals' },
        { href: '/furniture-removalists-adelaide/', label: 'furniture removalists southern suburbs' },
      ],
      guides: [
        { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'Adelaide removalist costs' },
        { href: '/adelaide-moving-guides/suburb-move-preparation-adelaide/', label: 'suburb move preparation' },
        { href: '/adelaide-moving-guides/prepare-house-move-adelaide/', label: 'house move preparation guide' },
      ],
    };
  }

  if (['northern', 'northern fringe', 'north-eastern', 'inner north', 'west-north'].includes(normalizedClusterKey)) {
    return {
      hubs: [
        { href: '/removalists-northern-adelaide/', label: 'northern Adelaide removals hub' },
        { href: '/removalists-salisbury/', label: 'Salisbury planning hub' },
        { href: '/removalists-elizabeth/', label: 'Elizabeth removalists' },
      ],
      services: [
        { href: '/house-removals-adelaide/', label: 'house removals northern Adelaide' },
        { href: '/cheap-removalists-adelaide/', label: 'budget-friendly removals' },
        { href: '/storage-friendly-removals-adelaide/', label: 'storage-linked removals' },
        { href: '/interstate-removals-adelaide/', label: 'interstate departures north' },
      ],
      guides: [
        { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
        { href: '/adelaide-moving-guides/suburb-move-preparation-adelaide/', label: 'suburb move preparation' },
        { href: '/adelaide-moving-guides/packing-checklist-adelaide/', label: 'packing checklist guide' },
      ],
    };
  }

  if (['western', 'inner west'].includes(normalizedClusterKey)) {
    return {
      hubs: [
        { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
        { href: '/removalists-southern-adelaide/', label: 'southern Adelaide hub' },
        { href: '/removalists-northern-adelaide/', label: 'northern Adelaide hub' },
      ],
      services: [
        { href: '/office-relocation-adelaide/', label: 'office relocation services' },
        { href: '/same-day-removalists-adelaide/', label: 'same-day local removalists' },
        { href: '/packing-services-adelaide/', label: 'packing and protection' },
        { href: '/furniture-removalists-adelaide/', label: 'furniture handling western suburbs' },
      ],
      guides: [
        { href: '/adelaide-moving-guides/office-relocation-preparation-adelaide/', label: 'office relocation preparation' },
        { href: '/adelaide-moving-guides/apartment-moving-tips-adelaide/', label: 'apartment moving tips' },
        { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'Adelaide removalist cost guide' },
      ],
    };
  }

  return {
    hubs: [
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
      { href: '/interstate-removals-adelaide/', label: 'interstate removals hub' },
    ],
    services: [
      { href: '/house-removals-adelaide/', label: 'house removals in Adelaide' },
      { href: '/packing-services-adelaide/', label: 'packing services in Adelaide' },
      { href: '/furniture-removalists-adelaide/', label: 'furniture removalists in Adelaide' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/moving-checklist-adelaide/', label: 'moving checklist guide' },
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'removalist cost guide' },
      { href: '/adelaide-moving-guides/how-long-moves-take-adelaide/', label: 'move timing guide' },
    ],
  };
}

export function getInterstateSupportProfile(routeSlug) {
  const allRoutes = [
    { href: '/adelaide-to-melbourne-removals/', label: 'Adelaide to Melbourne' },
    { href: '/adelaide-to-sydney-removals/', label: 'Adelaide to Sydney' },
    { href: '/adelaide-to-brisbane-removals/', label: 'Adelaide to Brisbane' },
    { href: '/adelaide-to-canberra-removals/', label: 'Adelaide to Canberra' },
    { href: '/adelaide-to-perth-removals/', label: 'Adelaide to Perth' },
    { href: '/adelaide-to-queensland-removals/', label: 'Adelaide to Queensland' },
  ];

  return {
    hubs: [
      { href: '/interstate-removals-adelaide/', label: 'interstate removals hub' },
      { href: '/removalists-adelaide/', label: 'Adelaide removals hub' },
    ],
    services: [
      { href: '/packing-services-adelaide/', label: 'full packing and protection' },
      { href: '/furniture-removalists-adelaide/', label: 'specialist furniture handling' },
      { href: '/office-removals-adelaide/', label: 'interstate office relocations' },
    ],
    guides: [
      { href: '/adelaide-moving-guides/interstate-moving-checklist-adelaide/', label: 'interstate moving checklist' },
      { href: '/adelaide-moving-guides/how-long-moves-take-adelaide/', label: 'interstate timing guide' },
      { href: '/adelaide-moving-guides/removalist-cost-adelaide/', label: 'interstate cost factors' },
    ],
    siblings: allRoutes.filter(r => !r.href.includes(routeSlug)),
  };
}
