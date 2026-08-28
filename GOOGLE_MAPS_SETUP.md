# Google Maps service-area locator

The Adelaide hub locator is a service-area experience. Pins represent general suburb centres and are not ZQ offices, branches, depots, or Google Business Profile locations.

## Vercel configuration

Set `PUBLIC_GOOGLE_MAPS_API_KEY` as a browser key in the required Vercel environments. The optional `PUBLIC_GOOGLE_MAP_ID` may be set when a production Map ID is created; no demo Map ID is shipped.

Restrict the key to these HTTP referrers:

- `https://zqremovals.au/*`
- `https://www.zqremovals.au/*`

Add localhost only when local development genuinely needs the interactive map. Restrict the key to **Maps JavaScript API** only. The current locator uses local HTML filtering and does not require Places, Directions, Distance Matrix, or Place Details APIs.

Never commit the key or server credentials. The site remains useful with no key: the crawlable service-area links and quote/phone actions are always rendered, and the map shows a clear fallback.
