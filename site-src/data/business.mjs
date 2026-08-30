const googleProfileUrl = 'https://share.google/toaQ1pTUMpigxRuQM';

export const businessIdentity = {
  name: 'ZQ Removals',
  siteUrl: 'https://zqremovalsadelaide.com.au',
  email: 'admin@zqremovals.au',
  phone: {
    display: '0433 819 989',
    tel: '+61433819989',
    machine: '0433819989',
  },
  abn: {
    formatted: '97 954 095 119',
    machine: '97 954 095 119',
    verificationUrl: null,
    note: 'ABN is owner-provided; public ABR link is withheld until owner verification confirms the external record.',
  },
  address: {
    locality: 'Andrews Farm',
    region: 'SA',
    postalCode: '5114',
    country: 'AU',
  },
  serviceAreas: [
    'Adelaide',
    'South Australia',
    'Adelaide CBD',
    'Northern suburbs',
    'Southern suburbs',
    'Coastal suburbs',
    'Interstate Australia',
  ],
  socialProfiles: [
    googleProfileUrl,
    'https://facebook.com/zqremovals',
  ],
  defaultOgImagePath: '/zq-removals-social-share.webp',
  defaultLogoPath: '/brand-logo.webp',
};

export const googleReviews = {
  rating: 5.0,
  reviewCount: 81,
  profileUrl: googleProfileUrl,
  // Verified from owner-supplied screenshot. Update regularly, or connect this to an approved Google API before presenting it as live data.
  lastVerifiedSource: 'owner-supplied Google Business Profile screenshot',
};

export const googleReviewCards = [
  {
    reviewer: 'Rakib Rafi',
    excerpt:
      'Great service. They helped move my house a long way from Adelaide, almost 450km away. No scratch or damage to any of my furnitures. Better than compititors.',
  },
  {
    reviewer: 'coline tangai',
    excerpt: 'Very helpful and kind.',
  },
  {
    reviewer: 'Wayne Rowe (Wayno)',
    excerpt: 'Very efficient, on time and affordable. Friendly staff who made the move seem easy.',
  },
];

export const businessIdentifiers = {
  abnFormatted: businessIdentity.abn.formatted,
  abnMachine: businessIdentity.abn.machine,
};

export const movingRates = {
  twoMenAndTruck: '$75 per 30 minutes',
  threeMenAndTruck: '$89 per 30 minutes',
  travelCharge: 'A 1-hour call-out/travel charge applies where applicable.',
  summary: '2 men and a truck: $75 per 30 minutes. 3 men and a truck: $89 per 30 minutes. A 1-hour call-out/travel charge applies where applicable.',
};

export function businessUrl(pathname = '/') {
  return new URL(pathname, businessIdentity.siteUrl).toString();
}

export function buildPostalAddressSchema() {
  return {
    '@type': 'PostalAddress',
    addressLocality: businessIdentity.address.locality,
    addressRegion: businessIdentity.address.region,
    postalCode: businessIdentity.address.postalCode,
    addressCountry: businessIdentity.address.country,
  };
}
