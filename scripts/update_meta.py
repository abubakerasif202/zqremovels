import json

with open('site-src/pages.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

updates = {
    'index.html': {
        'title': 'Removalists Adelaide | Trusted Local Movers | ZQ Removals',
        'description': "Adelaide's trusted removalists for house, furniture, office and interstate moves. Locally owned, fully insured, fixed-price quotes. Call 0433 819 989.",
        'ogTitle': 'Removalists Adelaide | Trusted Local Movers | ZQ Removals',
        'ogDescription': "Adelaide's trusted removalists. House, furniture, office and interstate moves. Locally owned, fully insured.",
        'twitterTitle': 'Removalists Adelaide | Trusted Local Movers | ZQ Removals',
        'twitterDescription': "Adelaide's trusted removalists. House, furniture, office and interstate moves. Locally owned, fully insured.",
    },
    'removalists-adelaide/index.html': {
        'title': 'Removalists Adelaide | Local, Insured, Fixed-Price Quotes | ZQ Removals',
        'description': 'Looking for trusted removalists in Adelaide? ZQ Removals handles house, apartment, office and furniture moves across all Adelaide suburbs. Fixed-price quotes. Call 0433 819 989.',
        'ogTitle': 'Removalists Adelaide | Local, Insured, Fixed-Price Quotes | ZQ Removals',
        'ogDescription': 'ZQ Removals: house, apartment, office and furniture moves across all Adelaide suburbs. Fixed-price quotes, fully insured.',
        'twitterTitle': 'Removalists Adelaide | Local, Insured, Fixed-Price Quotes | ZQ Removals',
        'twitterDescription': 'ZQ Removals: house, apartment, office and furniture moves across all Adelaide suburbs. Fixed-price quotes, fully insured.',
    },
    'interstate-removals-adelaide/index.html': {
        'title': 'Interstate Removalists Adelaide | Fixed-Rate Long-Distance Moves | ZQ Removals',
        'description': 'Moving interstate from Adelaide? ZQ Removals provides fully insured interstate removals to Melbourne, Sydney, Brisbane and beyond. Fixed-price quotes, careful delivery planning.',
        'ogTitle': 'Interstate Removalists Adelaide | Fixed-Rate Long-Distance Moves | ZQ Removals',
        'ogDescription': 'Fully insured interstate removals from Adelaide to Melbourne, Sydney, Brisbane and beyond. Fixed-price quotes.',
        'twitterTitle': 'Interstate Removalists Adelaide | Fixed-Rate Long-Distance Moves | ZQ Removals',
        'twitterDescription': 'Fully insured interstate removals from Adelaide to Melbourne, Sydney, Brisbane and beyond. Fixed-price quotes.',
    },
    'removalists-glenelg/index.html': {
        'title': 'Removalists Glenelg | Local Movers in Glenelg SA | ZQ Removals',
        'description': 'Need removalists in Glenelg? ZQ Removals handles apartment and home moves across Glenelg and nearby beach suburbs. Fully insured, available 7 days. Get your free quote.',
        'ogTitle': 'Removalists Glenelg | Local Movers in Glenelg SA | ZQ Removals',
        'ogDescription': 'ZQ Removals handles apartment and home moves in Glenelg. Fully insured, available 7 days.',
        'twitterTitle': 'Removalists Glenelg | Local Movers in Glenelg SA | ZQ Removals',
        'twitterDescription': 'ZQ Removals handles apartment and home moves in Glenelg. Fully insured, available 7 days.',
    },
    'removalists-marion/index.html': {
        'title': 'Removalists Marion | Local Movers in Marion Adelaide | ZQ Removals',
        'description': 'Removalists servicing Marion and surrounding southern Adelaide suburbs. Professional house and unit moves, fully insured, fixed-price quotes. Call ZQ Removals today.',
        'ogTitle': 'Removalists Marion | Local Movers in Marion Adelaide | ZQ Removals',
        'ogDescription': 'Professional removalists in Marion, SA. Fully insured, fixed-price quotes from ZQ Removals.',
        'twitterTitle': 'Removalists Marion | Local Movers in Marion Adelaide | ZQ Removals',
        'twitterDescription': 'Professional removalists in Marion, SA. Fully insured, fixed-price quotes from ZQ Removals.',
    },
    'furniture-removalists-adelaide/index.html': {
        'title': 'Furniture Removalists Adelaide | Safe, Insured Movers | ZQ Removals',
        'description': 'Adelaide furniture removalists for sofas, beds, wardrobes, pianos and antiques. Fully insured professional crew, careful wrapping on every item. Get a free quote today.',
        'ogTitle': 'Furniture Removalists Adelaide | Safe, Insured Movers | ZQ Removals',
        'ogDescription': 'Adelaide furniture removalists for sofas, beds, wardrobes, pianos and antiques. Fully insured, professional crew.',
        'twitterTitle': 'Furniture Removalists Adelaide | Safe, Insured Movers | ZQ Removals',
        'twitterDescription': 'Adelaide furniture removalists for sofas, beds, wardrobes, pianos and antiques. Fully insured, professional crew.',
    },
    'office-removals-adelaide/index.html': {
        'title': 'Office Removals Adelaide | Commercial Movers, Minimal Downtime | ZQ Removals',
        'description': 'Professional office and commercial removals in Adelaide. After-hours moves available, careful IT handling, minimal business disruption. Get a free business relocation quote.',
        'ogTitle': 'Office Removals Adelaide | Commercial Movers, Minimal Downtime | ZQ Removals',
        'ogDescription': 'Professional office removals in Adelaide. After-hours moves, careful IT handling, minimal downtime. ZQ Removals.',
        'twitterTitle': 'Office Removals Adelaide | Commercial Movers, Minimal Downtime | ZQ Removals',
        'twitterDescription': 'Professional office removals in Adelaide. After-hours moves, careful IT handling, minimal downtime.',
    },
    'removalists-salisbury/index.html': {
        'title': 'Removalists Salisbury | Local Movers in Salisbury Adelaide | ZQ Removals',
        'description': 'Removalists servicing Salisbury and northern Adelaide. Professional house moves, fully insured, same-day quotes. Call ZQ Removals — available 7 days a week.',
        'ogTitle': 'Removalists Salisbury | Local Movers in Salisbury Adelaide | ZQ Removals',
        'ogDescription': 'Professional removalists in Salisbury and northern Adelaide. Fully insured, same-day quotes from ZQ Removals.',
        'twitterTitle': 'Removalists Salisbury | Local Movers in Salisbury Adelaide | ZQ Removals',
        'twitterDescription': 'Professional removalists in Salisbury and northern Adelaide. Fully insured, same-day quotes from ZQ Removals.',
    },
    'adelaide-moving-guides/removalists-cost-adelaide/index.html': {
        'title': 'How Much Do Removalists Cost in Adelaide? 2026 Guide | ZQ Removals',
        'description': 'Honest 2026 guide to Adelaide removalist costs. Hourly rates, fixed quotes, what drives prices up or down. Get an accurate quote from ZQ Removals — no hidden fees.',
        'ogTitle': 'How Much Do Removalists Cost in Adelaide? 2026 Guide | ZQ Removals',
        'ogDescription': 'Honest 2026 guide to Adelaide removalist costs — hourly rates, fixed quotes, pricing factors. Free accurate quote from ZQ Removals.',
        'twitterTitle': 'How Much Do Removalists Cost in Adelaide? 2026 Guide | ZQ Removals',
        'twitterDescription': 'Honest 2026 guide to Adelaide removalist costs — hourly rates, fixed quotes, pricing factors. Free accurate quote from ZQ Removals.',
    },
}

changed = 0
for page in pages:
    output = page['output']
    if output in updates:
        for key, val in updates[output].items():
            page[key] = val
        changed += 1

print(f'Updated {changed} pages')

with open('site-src/pages.json', 'w', encoding='utf-8') as f:
    json.dump(pages, f, indent=2, ensure_ascii=False)
    f.write('\n')

print('pages.json written successfully')
