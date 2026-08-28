import { zqPrioritySuburbRoutes, zqSuburbGeoData } from './zq-suburbs.mjs';

const locatorSlugs = new Set([
  'adelaide-cbd',
  'norwood',
  'glenelg',
  'unley',
  'mawson-lakes',
  'mount-barker',
  'salisbury',
  'marion',
  'prospect',
  'burnside',
  'magill',
]);

const verifiedLocatorRoutes = new Map([
  ['adelaide-cbd', '/removalists-adelaide-cbd/'],
  ...zqPrioritySuburbRoutes.map(({ slug, path }) => [slug, path]),
]);

export const zqServiceAreaMapConfig = {
  center: { lat: -34.9285, lng: 138.6007 },
  zoom: 10,
  locations: [...locatorSlugs]
    .map((slug) => {
      const area = zqSuburbGeoData[slug];
      if (!area) return null;
      return {
        slug,
        title: area.name,
        label: 'Service Area',
        latitude: area.latitude,
        longitude: area.longitude,
        url: verifiedLocatorRoutes.get(slug),
      };
    })
    .filter((location) => location?.url),
};

export function getGoogleMapsBrowserConfig() {
  return {
    ...zqServiceAreaMapConfig,
    apiKey: String(process.env.PUBLIC_GOOGLE_MAPS_API_KEY || '').trim(),
    mapId: String(process.env.PUBLIC_GOOGLE_MAP_ID || '').trim(),
  };
}
