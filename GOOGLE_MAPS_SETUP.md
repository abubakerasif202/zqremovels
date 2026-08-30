# Google Maps service-area locator

The Adelaide hub locator is a service-area experience. Pins represent general suburb centres and are not ZQ offices, branches, depots, or Google Business Profile locations.

## Vercel configuration

Set `PUBLIC_GOOGLE_MAPS_API_KEY` as a browser key in the required Vercel environments. The optional `PUBLIC_GOOGLE_MAP_ID` may be set when a production Map ID is created; no demo Map ID is shipped.

Restrict the key to these HTTP referrers:

- `https://zqremovalsadelaide.com.au/*`
- `https://zqremovalsadelaide.com.au/*`

Add localhost only when local development genuinely needs the interactive map. Restrict the key to **Maps JavaScript API** only. The current locator uses local HTML filtering and does not require Places, Directions, Distance Matrix, or Place Details APIs.

The site uses the Maps JavaScript API directly instead of `@googlemaps/extended-component-library`'s Store Locator element. That element is designed around store/business records and would be a poor fit for ZQ's service-area pins: this implementation has no Place IDs, addresses, store actions, or business-location schema. The same lazy-loader principle is retained while the HTML list remains the source of truth.

Never commit the key or server credentials. The site remains useful with no key: the crawlable service-area links and quote/phone actions are always rendered, and the map shows a clear fallback.
