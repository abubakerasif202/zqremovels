const SITE_URL = 'https://zqremovals.au';
const BUSINESS_NAME = 'ZQ Removals';
const PHONE = '+61 433 819 989';
const DEFAULT_OG_IMAGE = `${SITE_URL}/zq-removals-social-share.webp`;
const DEFAULT_LOGO = `${SITE_URL}/brand-logo.webp`;

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
  openingHours: 'Mo-Su 00:00-23:59',
  priceRange: '$150/hr',
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

export function buildTitle(partial) {
  const raw = partial.includes('|') ? partial : `${partial} | ZQ Removals`;
  return clampText(raw, seoConfig.titleMaxLength);
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
    .filter((page) => page.output.startsWith('removalists-'))
    .map((page) => {
      const slug = page.output.replace(/^removalists-/, '').replace(/\/index\.html$/, '');
      const suburb = getSuburbData(slug);
      const cluster = clusterTemplates[suburb?.clusterKey] || clusterTemplates.northern;
      const faqPool = getFaqPool(suburb?.clusterKey || 'northern');
      const supportingHubs = cluster.supportingHubs || [];
      const siblings = cluster.siblings || [];
      const guideLinks = cluster.guideLinks || [];

      return {
        slug,
        suburb: suburb?.suburb || slug,
        region: suburb?.region || 'Adelaide',
        clusterKey: suburb?.clusterKey || 'northern',
        canonical: page.canonical,
        hubPaths: [cluster.hub || '/removalists-adelaide/', '/removalists-adelaide/', ...supportingHubs].filter(Boolean),
        siblingPaths: siblings,
        guidePaths: guideLinks,
        faqTopics: faqPool.map((item) => item.question),
        traceableFrom: [
          cluster.hub || '/removalists-adelaide/',
          '/removalists-adelaide/',
          ...supportingHubs,
          ...siblings.slice(0, 3),
        ].filter(Boolean),
      };
    });
}

function clampText(value, limit) {
  const text = String(value).trim().replace(/\s+/g, ' ');
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

function getSuburbData(slug) {
  return suburbDataBySlug.get(slug);
}

function getFaqPool(clusterKey) {
  return faqPools[clusterKey] || faqPools.northern;
}

const suburbData = [
  ['adelaide-cbd', 'Adelaide CBD', 'Adelaide CBD', 'CBD', 'tower and lift planning'],
  ['north-adelaide', 'North Adelaide', 'North Adelaide', 'CBD fringe', 'heritage access and parking'],
  ['glenelg', 'Glenelg', 'Glenelg', 'coastal', 'beachside apartments and parking'],
  ['marion', 'Marion', 'Marion', 'southern', 'family homes and mixed-use access'],
  ['salisbury', 'Salisbury', 'Salisbury', 'northern', 'garage-heavy household moves'],
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
  ['semore', 'Semaphore', 'Semaphore', 'coastal', 'beachfront apartments and tight access'],
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
];

const suburbDataBySlug = new Map(
  suburbData.map(([slug, suburb, region, clusterKey, logisticsLabel]) => [
    slug,
    { slug, suburb, region, clusterKey, logisticsLabel },
  ]),
);

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

const guideTopics = [
  ['moving-checklist-adelaide', 'Moving checklist Adelaide', 'moving checklist', 'article'],
  ['removalist-cost-adelaide', 'Removalist cost Adelaide', 'cost guide', 'article'],
  ['apartment-moving-tips-adelaide', 'Apartment moving tips Adelaide', 'apartment moves', 'article'],
  ['storage-planning-adelaide', 'Storage planning Adelaide', 'storage planning', 'article'],
  ['office-relocation-preparation-adelaide', 'Office relocation preparation Adelaide', 'office preparation', 'article'],
  ['packing-tips-adelaide', 'Packing tips Adelaide', 'packing tips', 'article'],
  ['booking-timing-guide-adelaide', 'Booking timing guide Adelaide', 'booking timing', 'article'],
  ['suburb-move-preparation-adelaide', 'Suburb move preparation Adelaide', 'suburb move prep', 'article'],
];

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

  for (const [slug, title, topic, type] of guideTopics) {
    pages.push(makeGuidePage({ slug, title, topic, type }));
  }

  return pages;
}

function makeStaticPage(page) {
  return {
    output: page.output,
    layout: 'standard',
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
    extra: page.extra,
  };
}

function makeSuburbPage({ slug, suburb, region, clusterKey, logisticsLabel }) {
  const canonical = buildCanonical(`/removalists-${slug}/`);
  const template = clusterTemplates[clusterKey] || clusterTemplates.northern;
  const intro = template.intro.replaceAll('{suburb}', suburb);
  const nearby = template.nearby.filter((name) => name !== suburb).slice(0, 3);
  const faqPool = getFaqPool(clusterKey);
  const title = buildTitle(`${suburb} Removalists | ${logisticsLabel}`);
  const description = buildDescription(`${suburb} removalists for ${logisticsLabel}, with suburb-specific planning, local access notes, and a clear quote path.`);
  return {
    output: `removalists-${slug}/index.html`,
    layout: 'standard',
    title,
    description,
    canonical,
    robots: seoConfig.robots,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: DEFAULT_OG_IMAGE,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: DEFAULT_OG_IMAGE,
    jsonLd: [
      JSON.stringify(buildLocalBusinessSchema()),
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
      JSON.stringify(buildFAQSchema([
        {
          question: `Do you handle ${suburb} moves with ${logisticsLabel}?`,
          answer: `Yes. ${suburb} moves are planned around ${logisticsLabel} so the access, inventory, and timing brief stays realistic.`,
        },
        {
          question: `What nearby suburbs are relevant for ${suburb}?`,
          answer: `${nearby.join(', ')} are common nearby reference points for route planning and suburb comparisons.`,
        },
        ...faqPool,
      ], canonical)),
    ],
    contentHtml: renderSuburbContent({ suburb, region, intro, logisticsLabel, nearby, clusterKey }),
  };
}

function makeGuidePage({ slug, title, topic }) {
  const canonical = buildCanonical(`/adelaide-moving-guides/${slug}/`);
  const description = buildDescription(`A practical Adelaide guide for ${topic}, written to support quote-ready planning and clear access decisions.`);
  return {
    output: `adelaide-moving-guides/${slug}/index.html`,
    layout: 'standard',
    title: buildTitle(title),
    description,
    canonical,
    robots: seoConfig.robots,
    ogTitle: buildTitle(title),
    ogDescription: description,
    ogUrl: canonical,
    ogImage: DEFAULT_OG_IMAGE,
    twitterTitle: buildTitle(title),
    twitterDescription: description,
    twitterImage: DEFAULT_OG_IMAGE,
    jsonLd: [
      JSON.stringify(buildBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Adelaide Moving Guides', url: `${SITE_URL}/adelaide-moving-guides/` },
        { name: title, url: canonical },
      ], canonical)),
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        headline: title,
        description,
        mainEntityOfPage: { '@id': `${canonical}#webpage` },
        author: { '@type': 'Organization', name: BUSINESS_NAME },
        publisher: { '@type': 'Organization', name: BUSINESS_NAME },
      }),
    ],
    contentHtml: renderGuideContent({ title, topic, canonical }),
  };
}

function renderOverviewPage() {
  return `<section class="section"><div class="container"><h1>ZQ SEO V4</h1><p>Centralised SEO architecture for scalable Adelaide local landing pages, service pages, guides, and automated sitemap generation.</p></div></section>`;
}

function renderSuburbContent({ suburb, region, intro, logisticsLabel, nearby, clusterKey }) {
  const actions = {
    coastal: 'Plan coastal move',
    'southern coastal': 'Plan coastal move',
    southern: 'Book family-home move',
    northern: 'Get suburb-specific quote',
    'northern fringe': 'Get suburb-specific quote',
    eastern: 'Book eastern-corridor move',
    'inner east': 'Book eastern-corridor move',
    'CBD fringe': 'Book apartment move',
    CBD: 'Book apartment move',
  };
  const cta = actions[region] || 'Get suburb-specific quote';
  const faqPool = getFaqPool(clusterKey);
  const supportGuideMap = {
    'Plan coastal move': '/adelaide-moving-guides/coastal-moving-access-adelaide/',
    'Book family-home move': '/adelaide-moving-guides/avoiding-damage-adelaide/',
    'Get suburb-specific quote': '/adelaide-moving-guides/storage-planning-adelaide/',
    'Book eastern-corridor move': '/adelaide-moving-guides/pricing-breakdown-adelaide/',
    'Book apartment move': '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
  };
  const supportGuideHref = supportGuideMap[cta] || '/adelaide-moving-guides/storage-planning-adelaide/';
  const supportGuideLabel = supportGuideHref.split('/').filter(Boolean).pop().replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  const faqMarkup = faqPool
    .map((item) => `<details><summary>${item.question}</summary><p>${item.answer}</p></details>`)
    .join('');
  return `<section class="section"><div class="container"><h1>${suburb} removalists</h1><div class="section-heading"><span class="eyebrow">Route and intent expansion</span><h2>${cta} for ${suburb}</h2></div><p>${intro}</p><p>${suburb} sits in the ${region} cluster and usually needs ${logisticsLabel} planning.</p><p>Nearby areas for route planning include ${nearby.join(', ')}. This page also supports a clearer northern corridor, coastal brief, or corridor handoff where relevant.</p><div class="content-block"><h3>Local questions for ${suburb}</h3>${faqMarkup}</div><p><a href="/contact-us/#quote-form">${cta}</a> or compare <a href="/removalists-adelaide/">Adelaide removals</a> and <a href="${supportGuideHref}">${supportGuideLabel}</a>.</p></div></section>`;
}

function renderGuideContent({ title, topic, canonical }) {
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
  return `<section class="section"><div class="container"><h1>${title}</h1><p>This guide covers ${topic} for Adelaide customers who need a quote-ready brief.</p><p>${extras[topic] || 'Use this page to tighten the move brief before requesting a quote.'}</p><p><a href="/contact-us/#quote-form">Request a quote</a> after reviewing the planning notes.</p><p><a href="/adelaide-moving-guides/">Back to moving guides</a> or <a href="/removalists-adelaide/">review Adelaide removals</a>.</p></div></section>`;
}
