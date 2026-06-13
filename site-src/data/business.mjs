export const businessIdentity = {
  name: 'ZQ Removals',
  siteUrl: 'https://zqremovals.au',
  email: 'info@zqremovals.au',
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
    'https://share.google/Y04mpt9RTflWP3iRl',
    'https://facebook.com/zqremovals',
  ],
  defaultOgImagePath: '/zq-removals-social-share.webp',
  defaultLogoPath: '/brand-logo.webp',
};

export const businessIdentifiers = {
  abnFormatted: businessIdentity.abn.formatted,
  abnMachine: businessIdentity.abn.machine,
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
