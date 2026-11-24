import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const googleProfileUrl = 'https://share.google/afUxDQxO7PBWGSsxP';
const googleReviewUrl = 'https://g.page/r/Cb5kWH_Fcs9LEBM/review';
// Google Maps listing for "ZQ Removals Adelaide" (owner-supplied share link maps.app.goo.gl/jFEKZGFdYLNTEPec6),
// stored in its stable CID form so the URL carries no session or tracking parameters.
const googleMapsUrl = 'https://www.google.com/maps?cid=5462711065594324158';

export const businessIdentity = {
  name: 'ZQ Removals',
  // The name shown on the Google Business Profile; used for the MovingCompany entity so schema matches the listing.
  listingName: 'ZQ Removals Adelaide',
  siteUrl: 'https://zqremovalsadelaide.com.au',
  email: 'admin@zqremovalsadelaide.com.au',
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
  mapsUrl: googleMapsUrl,
  socialProfiles: [
    googleProfileUrl,
    'https://facebook.com/zqremovals',
  ],
  defaultOgImagePath: '/zq-removals-social-share.webp',
  defaultLogoPath: '/brand-logo.webp',
};

// Rating and review count come from google-reviews.json, which scripts/update-google-reviews.mjs refreshes from the
// Google Places API. The fallback below is used only if that file is missing or invalid.
const googleReviewsFallback = { rating: 5.0, reviewCount: 100 };

// Astro bundles this module for prerendering, so `import.meta.url` can point into the bundle where the JSON file does
// not exist. Try the project-root path as well so Astro-rendered pages use the refreshed data instead of the fallback.
const googleReviewsFileCandidates = [
  new URL('./google-reviews.json', import.meta.url),
  pathToFileURL(path.join(process.cwd(), 'site-src', 'data', 'google-reviews.json')),
];

function readGoogleReviewsData() {
  for (const file of googleReviewsFileCandidates) {
    try {
      const data = JSON.parse(readFileSync(file, 'utf8'));
      const rating = Number(data.rating);
      const reviewCount = Number(data.reviewCount);
      if (rating >= 1 && rating <= 5 && Number.isInteger(reviewCount) && reviewCount > 0) {
        return { rating, reviewCount, fetchedAt: String(data.fetchedAt || ''), source: String(data.source || '') };
      }
    } catch {
      // Try the next candidate, then fall through to the fallback values.
    }
  }
  return { ...googleReviewsFallback, fetchedAt: '', source: 'fallback' };
}

const googleReviewsData = readGoogleReviewsData();

export const googleReviews = {
  rating: googleReviewsData.rating,
  reviewCount: googleReviewsData.reviewCount,
  profileUrl: googleProfileUrl,
  reviewUrl: googleReviewUrl,
  lastVerifiedSource: `${googleReviewsData.source} ${googleReviewsData.fetchedAt}`.trim(),
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
  // Small truck confirmed as a real published package by the owner on 2026-11-21 (crew confirmed with the quote).
  smallTruck: '$65 per 30 minutes',
  priceRange: '$65-$89 per 30 minutes',
  twoMenAndTruck: '$75 per 30 minutes',
  threeMenAndTruck: '$89 per 30 minutes',
  travelCharge: 'A 1-hour call-out/travel charge applies where applicable.',
  summary: 'Small truck: $65 per 30 minutes (crew confirmed with the quote). 2 men and a truck: $75 per 30 minutes. 3 men and a truck: $89 per 30 minutes. A 1-hour call-out/travel charge applies where applicable.',
};

// Opening hours match the Google Business Profile (owner-confirmed 2026-11-21): Monday to Sunday, 07:00-19:00.
export const businessOpeningHours = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  opens: '07:00',
  closes: '19:00',
};

export function buildOpeningHoursSpecification() {
  return [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [...businessOpeningHours.days],
      opens: businessOpeningHours.opens,
      closes: businessOpeningHours.closes,
    },
  ];
}

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
