const zqPrioritySuburbSlugs = [
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

export const zqSuburbGeoData = {
  'adelaide-cbd': {
    name: 'Adelaide CBD',
    latitude: -34.9285,
    longitude: 138.6007,
    council: 'City of Adelaide',
    landmarks: ['Rundle Mall', 'Adelaide Oval', 'Central Market', 'Victoria Square', 'River Torrens']
  },
  'glenelg': {
    name: 'Glenelg',
    latitude: -34.9818,
    longitude: 138.5140,
    council: 'City of Holdfast Bay',
    landmarks: ['Jetty Road', 'Glenelg Beach', 'Moseley Square', 'Holdfast Marina']
  },
  'norwood': {
    name: 'Norwood',
    latitude: -34.9234,
    longitude: 138.6338,
    council: 'City of Norwood Payneham & St Peters',
    landmarks: ['The Parade', 'Osmond Terrace', 'Norwood Town Hall', 'Norwood Oval']
  },
  'salisbury': {
    name: 'Salisbury',
    latitude: -34.7617,
    longitude: 138.6417,
    council: 'City of Salisbury',
    landmarks: ['Salisbury Highway', 'Parabanks Shopping Centre', 'Salisbury Interchange', 'Pioneer Park']
  },
  'elizabeth': {
    name: 'Elizabeth',
    latitude: -34.7171,
    longitude: 138.6708,
    council: 'City of Playford',
    landmarks: ['Elizabeth Shopping Centre', 'Playford Civic Centre', 'Fremont Park', 'Ridley Reserve']
  },
  'gawler': {
    name: 'Gawler',
    latitude: -34.5981,
    longitude: 138.7450,
    council: 'Town of Gawler',
    landmarks: ['Murray Street', 'Gawler River', 'Pioneer Park', 'Gawler Central Station']
  },
  'elizabeth-vale': {
    name: 'Elizabeth Vale',
    latitude: -34.7390,
    longitude: 138.6740,
    council: 'City of Playford',
    landmarks: ['Lyell McEwin Hospital', 'Elizabeth Vale Primary School', 'Harry Bowey Reserve']
  },
  'elizabeth-downs': {
    name: 'Elizabeth Downs',
    latitude: -34.7010,
    longitude: 138.6940,
    council: 'City of Playford',
    landmarks: ['Argana Park', 'Elizabeth Downs Shopping Centre', 'Uley Bury Winery']
  },
  'blakeview': {
    name: 'Blakeview',
    latitude: -34.6850,
    longitude: 138.6880,
    council: 'City of Playford',
    landmarks: ['Blakes Crossing Shopping Centre', 'Blakeview Primary School', 'Craigmore High School']
  },
  'northern-adelaide': {
    name: 'Northern Adelaide',
    latitude: -34.7300,
    longitude: 138.6500,
    council: 'City of Playford and City of Salisbury',
    landmarks: ['Mawson Lakes Boulevard', 'Main North Road', 'Elizabeth Way']
  },
  'marion': {
    name: 'Marion',
    latitude: -35.0000,
    longitude: 138.5500,
    council: 'City of Marion',
    landmarks: ['Westfield Marion', 'Marion Cultural Centre', 'SA Aquatic and Leisure Centre', 'Sturt River']
  },
  'mawson-lakes': {
    name: 'Mawson Lakes',
    latitude: -34.8117,
    longitude: 138.6117,
    council: 'City of Salisbury',
    landmarks: ['UniSA Mawson Lakes Campus', 'Mawson Centre', 'Mawson Lakes Boulevard', 'Shearwater Lake']
  },
  'unley': {
    name: 'Unley',
    latitude: -34.9500,
    longitude: 138.6000,
    council: 'City of Unley',
    landmarks: ['Unley Road', 'King William Road', 'Unley Oval', 'Orphanage Park']
  },
  'prospect': {
    name: 'Prospect',
    latitude: -34.8833,
    longitude: 138.5981,
    council: 'City of Prospect',
    landmarks: ['Prospect Road', 'Prospect Oval', 'Charles Cane Reserve', 'Memorial Gardens']
  },
  'modbury': {
    name: 'Modbury',
    latitude: -34.8320,
    longitude: 138.6790,
    council: 'City of Tea Tree Gully',
    landmarks: ['Westfield Tea Tree Plaza', 'Modbury Hospital', 'Civic Park', 'Waterworld']
  },
  'henley-beach': {
    name: 'Henley Beach',
    latitude: -34.9270,
    longitude: 138.4910,
    council: 'City of Charles Sturt',
    landmarks: ['Henley Square', 'Henley Beach Jetty', 'Grange Jetty', 'River Torrens Outlet']
  },
  'port-adelaide': {
    name: 'Port Adelaide',
    latitude: -34.8461,
    longitude: 138.5036,
    council: 'City of Port Adelaide Enfield',
    landmarks: ['Port Adelaide River', 'Fisherman\'s Wharf', 'National Railway Museum', 'Port Canal']
  },
  'mitcham': {
    name: 'Mitcham',
    latitude: -34.9833,
    longitude: 138.6167,
    council: 'City of Mitcham',
    landmarks: ['Mitcham Shopping Centre', 'Mitcham Reserve', 'Brownhill Creek', 'Carrick Hill']
  },
  'burnside': {
    name: 'Burnside',
    latitude: -34.9380,
    longitude: 138.6560,
    council: 'City of Burnside',
    landmarks: ['Burnside Village', 'Hazelwood Park', 'Tusmore Park', 'Waterfall Gully']
  },
  'magill': {
    name: 'Magill',
    latitude: -34.9167,
    longitude: 138.6667,
    council: 'City of Campbelltown and City of Burnside',
    landmarks: ['UniSA Magill Campus', 'Penfolds Grange Winery', 'Morialta Conservation Park']
  },
  'campbelltown': {
    name: 'Campbelltown',
    latitude: -34.8833,
    longitude: 138.6667,
    council: 'City of Campbelltown',
    landmarks: ['Campbelltown Memorial Oval', 'Lochiel Park', 'River Torrens Linear Park']
  },
  'golden-grove': {
    name: 'Golden Grove',
    latitude: -34.7790,
    longitude: 138.7300,
    council: 'City of Tea Tree Gully',
    landmarks: ['Golden Grove Village', 'Golden Fields Reserve', 'Cobbler Creek Recreation Park']
  },
  'tea-tree-gully': {
    name: 'Tea Tree Gully',
    latitude: -34.8250,
    longitude: 138.7240,
    council: 'City of Tea Tree Gully',
    landmarks: ['Anstey Hill Recreation Park', 'Tea Tree Gully Golf Club', 'Civic Park']
  },
  'brighton': {
    name: 'Brighton',
    latitude: -35.0167,
    longitude: 138.5167,
    council: 'City of Holdfast Bay',
    landmarks: ['Jetty Road Brighton', 'Brighton Beach', 'Brighton Jetty', 'Archrye Reserve']
  },
  'west-lakes': {
    name: 'West Lakes',
    latitude: -34.8833,
    longitude: 138.4833,
    council: 'City of Charles Sturt',
    landmarks: ['Westfield West Lakes', 'West Lakes Golf Club', 'Football Park Precinct']
  },
  'semaphore': {
    name: 'Semaphore',
    latitude: -34.8390,
    longitude: 138.4840,
    council: 'City of Port Adelaide Enfield',
    landmarks: ['Semaphore Jetty', 'Semaphore Esplanade', 'Semaphore Road', 'Fort Glanville']
  },
  'victor-harbor': {
    name: 'Victor Harbor',
    latitude: -35.5500,
    longitude: 138.6167,
    council: 'City of Victor Harbor',
    landmarks: ['Granite Island', 'Horse Drawn Tram', 'Causeway', 'Victor Harbor Jetty']
  },
  'mount-barker': {
    name: 'Mount Barker',
    latitude: -35.0667,
    longitude: 138.8667,
    council: 'District Council of Mount Barker',
    landmarks: ['Mount Barker Summit', 'Laratinga Wetlands', 'Gawler Street', 'Keith Stephenson Park']
  },
  'hallett-cove': {
    name: 'Hallett Cove',
    latitude: -35.0667,
    longitude: 138.5083,
    council: 'City of Marion',
    landmarks: ['Hallett Cove Conservation Park', 'Sugarloaf', 'Hallett Cove Shopping Centre', 'Hallett Cove Railway Station']
  },
  'morphett-vale': {
    name: 'Morphett Vale',
    latitude: -35.1167,
    longitude: 138.5167,
    council: 'City of Onkaparinga',
    landmarks: ['Wilfred Taylor Reserve', 'Morphett Vale Shopping Centre', 'Woodcroft Town Centre']
  },
  'noarlunga': {
    name: 'Noarlunga',
    latitude: -35.1390,
    longitude: 138.4970,
    council: 'City of Onkaparinga',
    landmarks: ['Colonnades Shopping Centre', 'Noarlunga Hospital', 'Port Noarlunga Jetty', 'Onkaparinga River']
  },
  'seaford': {
    name: 'Seaford',
    latitude: -35.1950,
    longitude: 138.4840,
    council: 'City of Onkaparinga',
    landmarks: ['Seaford Shopping Centre', 'Moana Beach', 'Seaford Meadows Shopping Centre', 'Seaford Railway Station']
  },
  'reynella': {
    name: 'Reynella',
    latitude: -35.0930,
    longitude: 138.5370,
    council: 'City of Onkaparinga',
    landmarks: ['Old Reynella township', 'Reynella Shopping Centre', 'Pine Light Reserve']
  },
  'andrews-farm': {
    name: 'Andrews Farm',
    latitude: -34.6931,
    longitude: 138.6912,
    council: 'City of Playford',
    landmarks: ['Stebonheath Park', 'Andrews Farm Shopping Centre', 'Playford Lakes Golf Course']
  },
  'north-adelaide': {
    name: 'North Adelaide',
    latitude: -34.9080,
    longitude: 138.5960,
    council: 'City of Adelaide',
    landmarks: ['O\'Connell Street', 'Melbourne Street', 'Wellington Square', 'Adelaide Aquatic Centre']
  },
  'southern-adelaide': {
    name: 'Southern Adelaide',
    latitude: -35.0800,
    longitude: 138.5400,
    council: 'City of Marion and City of Onkaparinga',
    landmarks: ['South Road', 'Southern Expressway', 'Hallett Cove Conservation Park']
  }
};

