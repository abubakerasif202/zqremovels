# Tracking V2

## Vercel environment variables

```bash
VITE_GA_MEASUREMENT_ID=G-MNHNPP0087
VITE_GTM_ID=
VITE_META_PIXEL_ID=
```

Only configured providers are injected at build time.

## Events

- `call_click` (`category: conversion`, `label: phone_call`)
- `quote_click` (`category: conversion`, `label: quote_button`)
- `form_start` (`category: lead`, `label: quote_form`)
- `generate_lead` (`category: conversion`, `label: quote_form`)
- `service_cta_click` (`category: conversion`, `label: service_page_cta`)
- `mobile_menu_open` (`category: engagement`, `label: mobile_nav`)
- `outbound_click` (`category: engagement`, `label: outbound_link`)
- `page_view` (auto on load and route-state changes)

## Where events fire

- Phone links (`tel:`): `call_click`
- Quote/contact CTA links: `quote_click`
- First interaction in quote form: `form_start` (once per page/session per form)
- Successful quote submission: `generate_lead`
- Service/guide/suburb quote CTA context: `service_cta_click`
- Mobile menu open (`summary.mobile-menu-trigger`): `mobile_menu_open`
- External links (`http/https` off-site): `outbound_click`

## Provider mapping

- GA4: `window.gtag('event', ...)`
- GTM: `window.dataLayer.push(...)`
- Meta Pixel:
  - `call_click` -> `Contact`
  - `quote_click` -> `Lead`
  - `form_start` -> `Lead`
  - `generate_lead` -> `Lead`
  - `page_view` -> `PageView`
  - other custom interactions -> `trackCustom`

## Testing

### GA4 DebugView
1. Set `VITE_GA_MEASUREMENT_ID`.
2. Build + deploy.
3. Open site with GA DebugView active.
4. Trigger phone click, quote click, form start, lead submit, service CTA.

### GTM Preview
1. Set `VITE_GTM_ID`.
2. Build + deploy.
3. Open GTM Preview and confirm `page_view` + conversion events in dataLayer.

### Meta Pixel Helper
1. Set `VITE_META_PIXEL_ID`.
2. Build + deploy.
3. Confirm `PageView`, `Lead`, and `Contact` events.

## Deployment checklist

1. Set env vars in Vercel.
2. Deploy and confirm build output includes only enabled provider scripts.
3. Validate GTM noscript iframe appears only when `VITE_GTM_ID` is set.
4. Verify events in GA4 DebugView, GTM Preview, and Meta Pixel Helper.
