"""
Adds FAQPage JSON-LD schema blocks to pages that need them.
For pages that already have Service/MovingCompany schema, appends the FAQPage to the @graph.
"""
import json, copy

with open('site-src/pages.json', 'r', encoding='utf-8') as f:
    pages = json.load(f)

# FAQ data per page
FAQ_DATA = {
    'index.html': [
        ("How much do removalists cost in Adelaide?",
         "Adelaide house moves typically start from $150 per hour for a two-person team, with a minimum of 3 hours. Final cost depends on home size, access, distance, and whether packing support is needed. Request a fixed-price quote for your specific job."),
        ("How far in advance should I book a removalist?",
         "We recommend booking 2 to 4 weeks ahead for weekend moves, especially at end-of-month. Weekday moves can often be arranged with shorter notice. Contact us and we will confirm availability."),
        ("Do you move furniture only, or full house contents?",
         "Both. We handle single-item furniture moves, partial loads, and full house relocations. Tell us what you need and we will find the right solution."),
        ("Are you insured?",
         "Yes. ZQ Removals is fully insured on every job. We use furniture blankets, wrapping, and careful loading practices on every move."),
        ("Do you do interstate removals from Adelaide?",
         "Yes. We handle interstate removals from Adelaide to Melbourne, Sydney, Brisbane, and other major Australian cities. Get in touch for a fixed-price interstate quote."),
        ("What suburbs in Adelaide do you service?",
         "We service all Adelaide suburbs including Glenelg, Marion, Salisbury, Norwood, the CBD, Andrews Farm, Hallett Cove, Mawson Lakes, and everywhere in between."),
    ],
    'removalists-adelaide/index.html': [
        ("How much do Adelaide removalists charge?",
         "A standard two-person team in Adelaide starts from $150 per hour with a 3-hour minimum. Total cost depends on home size, access, distance, and packing requirements. We provide a fixed-price quote after reviewing the brief."),
        ("How long does a typical Adelaide house move take?",
         "A one-bedroom apartment typically takes 2 to 3 hours. A three-bedroom house is usually 4 to 6 hours. We will give you an estimated timeframe when you request your quote."),
        ("Can you move just a few items, or do you only do full house moves?",
         "Both. Whether it is a single piece of furniture or an entire house, we can accommodate your needs."),
        ("Do you work on weekends?",
         "Yes. We are available 7 days a week. Weekend slots fill quickly, so we recommend booking at least 2 weeks in advance for Saturday and Sunday moves."),
        ("What Adelaide suburbs do you service?",
         "We cover all Adelaide metropolitan suburbs including the CBD, Glenelg, Marion, Salisbury, Elizabeth, Norwood, North Adelaide, Mawson Lakes, Hallett Cove, and all surrounding areas."),
        ("Do you offer packing services?",
         "Yes, packing support is available. Let us know when requesting your quote and we will include this in your pricing."),
    ],
    'interstate-removals-adelaide/index.html': [
        ("How long does an interstate move from Adelaide take?",
         "Adelaide to Melbourne typically takes 1 to 2 days transit. Adelaide to Sydney: 2 to 3 days. Adelaide to Brisbane: 3 to 4 days. We confirm delivery windows when you book."),
        ("Do you offer fixed-price interstate quotes?",
         "Yes. We provide fixed-price quotes for interstate moves so you know exactly what you are paying before moving day. No hourly surprises."),
        ("Can I move just some of my furniture interstate, not everything?",
         "Yes. Partial interstate moves using shared truck space are available and can significantly reduce your cost. Ask about this option when requesting your quote."),
        ("Do you pack for interstate moves?",
         "Yes. We strongly recommend professional packing for interstate moves to protect items over long distances. We use quality materials including double-walled boxes and furniture blankets."),
        ("Are my belongings insured during an interstate move?",
         "Yes. All ZQ Removals interstate jobs are fully insured. Ask for details when requesting your quote."),
        ("How much does an interstate removal from Adelaide cost?",
         "Interstate removal costs depend on volume, destination, access at both addresses, and packing requirements. Contact us for a fixed-price quote based on your specific move."),
    ],
    'removalists-glenelg/index.html': [
        ("Do you service Glenelg for removals?",
         "Yes. Glenelg is one of our regularly serviced areas. We handle house, apartment, and business moves across Glenelg and nearby coastal suburbs including Brighton, Somerton Park, and Hove."),
        ("Can you handle apartment moves in Glenelg?",
         "Yes. We are experienced with Glenelg apartment blocks — shared lifts, stairwells, restricted loading zones, and Jetty Road parking. We plan around your building's access conditions."),
        ("How much does a removal in Glenelg cost?",
         "Glenelg removals are priced at our standard Adelaide rates, starting from $150 per hour for a two-person team. Final cost depends on home size, access, and distance. Request a free quote for your specific job."),
        ("Do you move from Glenelg to other Adelaide suburbs?",
         "Yes. We handle moves within Glenelg, from Glenelg to any Adelaide suburb, and interstate departures from Glenelg addresses."),
        ("How far in advance should I book a Glenelg move?",
         "We recommend 2 to 3 weeks for weekend moves, especially in summer when demand along the beach corridor is high. Weekday moves can often be arranged with shorter notice."),
    ],
    'removalists-marion/index.html': [
        ("Do you provide removals in Marion, SA?",
         "Yes. Marion is one of our regularly serviced areas. We handle house moves, furniture removals, and office relocations across Marion and surrounding southern suburbs."),
        ("What suburbs near Marion do you also service?",
         "We service all surrounding suburbs including Mitchell Park, Sturt, Oaklands Park, Seacombe Gardens, Marino, and Hallett Cove. Contact us to confirm if your suburb is covered."),
        ("How much does a removal in Marion cost?",
         "Marion removals start from $150 per hour for a two-person team, with a 3-hour minimum. Final cost depends on home size, access, and distance. Request a free quote for an accurate price."),
        ("Can you move heavy furniture in Marion?",
         "Yes. We handle all types of furniture including large wardrobes, dining tables, lounge suites, beds, and heavy items. All items are wrapped and protected before loading."),
        ("Do you offer weekend removals in Marion?",
         "Yes. We are available 7 days a week including weekends. Saturday and Sunday slots are popular, so book at least 2 weeks in advance to secure your preferred date."),
    ],
    'furniture-removalists-adelaide/index.html': [
        ("What types of furniture do you move in Adelaide?",
         "We move all household and office furniture including sofas, beds, bed frames, dining tables, wardrobes, tall boys, bookshelves, TV units, desks, pianos, antiques, mirrors, and artwork."),
        ("Do you move pianos?",
         "Yes. Pianos require specialist handling due to their weight and mechanics. We use appropriate equipment and experienced crew. Please mention piano moves when requesting your quote."),
        ("How do you protect furniture during the move?",
         "Every piece of furniture is wrapped in heavy-duty furniture blankets before loading. Fragile items receive additional protection with foam wrapping or cardboard corner guards. Furniture is secured in the truck to prevent movement in transit."),
        ("Can I hire you to move just one or two pieces of furniture?",
         "Yes. We offer single-item and small furniture moves. Many Adelaide customers hire us to move just a fridge, sofa, or dining table between addresses."),
        ("How much does furniture removal cost in Adelaide?",
         "Furniture removals start from $150 per hour for a two-person team. Single-item moves have a minimum charge. Cost varies by volume, access, and distance. Get a free quote for your specific job."),
        ("Are my furniture items insured during the move?",
         "Yes. ZQ Removals is fully insured. Your furniture is covered from the moment our team begins loading to the moment everything is placed in your new home."),
    ],
    'office-removals-adelaide/index.html': [
        ("Can you move our office over a weekend to avoid disrupting business?",
         "Yes. After-hours and weekend office moves are available. We schedule commercial moves around your business hours so your team arrives Monday morning at a fully set-up new office."),
        ("Do you handle IT equipment like computers, monitors, and printers?",
         "Yes. We handle standard office IT equipment including desktop computers, monitors, and printers. We recommend your IT team handle server disconnection, but we transport all equipment safely."),
        ("How much does an office removal in Adelaide cost?",
         "Office removal costs depend on the size of your premises, volume of items, number of crew required, and timing. We provide a detailed quote after reviewing the brief. Contact us to arrange a consultation."),
        ("Do you provide packing services for office moves?",
         "Yes. Our team can pack your entire office prior to move day, including desks, storage areas, and kitchen items. Packing is quoted separately."),
        ("Are you insured for commercial moves?",
         "Yes. ZQ Removals carries full insurance for commercial removal jobs. We can provide proof of insurance if required by your building manager."),
        ("What Adelaide business areas do you service?",
         "We service the Adelaide CBD, North Adelaide, Norwood, Prospect, Port Adelaide, Thebarton, Mile End, Marion, and all metropolitan Adelaide suburbs."),
    ],
    'removalists-salisbury/index.html': [
        ("Do you service Salisbury for removals?",
         "Yes. Salisbury is one of our regularly serviced northern Adelaide areas. We handle house moves, furniture removals, and storage transfers across Salisbury and nearby suburbs."),
        ("What suburbs near Salisbury do you also service?",
         "We service all surrounding northern Adelaide suburbs including Mawson Lakes, Para Hills, Elizabeth, Salisbury Downs, and Andrews Farm, which is our service base."),
        ("How much does a removal in Salisbury cost?",
         "Salisbury removals start from $150 per hour for a two-person team, with a 3-hour minimum. Final cost depends on home size, access, and distance. Request a free quote for your specific job."),
        ("Do you move from Salisbury to other Adelaide suburbs?",
         "Yes. We handle moves from Salisbury to any Adelaide suburb, as well as moves within Salisbury itself."),
        ("Can you help with short-notice moves in Salisbury?",
         "Depending on availability, yes. Weekday moves especially can often be arranged with short notice. Contact us to check availability for your preferred dates."),
    ],
    'adelaide-moving-guides/removalists-cost-adelaide/index.html': [
        ("What is the average hourly rate for removalists in Adelaide?",
         "In 2026, most Adelaide removalists charge between $140 and $180 per hour for a two-person team with a truck. Very cheap rates under $100 per hour are often a red flag — check that the company is insured and includes travel time transparently."),
        ("Is there a minimum charge for removalists in Adelaide?",
         "Most Adelaide removalists charge a minimum of 2 to 3 hours. Some also charge a callout fee or depot-to-depot travel time on top of the hourly rate. Always confirm this when getting quotes."),
        ("Do removalists charge more on weekends?",
         "Some do, some do not. Always ask when requesting your quote. Weekend surcharges of 10 to 20 percent are common in the industry."),
        ("How can I reduce the cost of my Adelaide move?",
         "To keep costs down: book a weekday move if possible, have boxes pre-packed before the crew arrives, disassemble flat-pack furniture in advance, ensure clear access at both addresses, and avoid peak periods like end-of-month."),
        ("Should I choose an hourly rate or a fixed quote?",
         "For straightforward moves with easy access and a known volume, a fixed quote gives cost certainty. For moves where scope could change, an hourly rate may be fairer. Ask your removalist which they recommend for your specific job."),
        ("What is included in a standard Adelaide removalist quote?",
         "A standard quote should include crew labour, truck hire, furniture blankets, and basic protection. Packing materials, packing labour, stairs, long carries, and travel time may be additional. Always ask for a full written breakdown."),
        ("How do I avoid being overcharged by a removalist?",
         "Always get a written quote before committing, confirm what is included and what is additional, check the company is insured, read Google reviews from verified local customers, and avoid any company that will not provide a written quote."),
    ],
}

def make_faq_schema(faqs, page_id):
    schema = {
        "@type": "FAQPage",
        "@id": f"{page_id}#faq",
        "mainEntity": []
    }
    for q, a in faqs:
        schema["mainEntity"].append({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": a
            }
        })
    return schema

BASE_URL = "https://zqremovals.au/"
PAGE_URL_MAP = {
    'index.html': 'https://zqremovals.au/',
    'removalists-adelaide/index.html': 'https://zqremovals.au/removalists-adelaide/',
    'interstate-removals-adelaide/index.html': 'https://zqremovals.au/interstate-removals-adelaide/',
    'removalists-glenelg/index.html': 'https://zqremovals.au/removalists-glenelg/',
    'removalists-marion/index.html': 'https://zqremovals.au/removalists-marion/',
    'furniture-removalists-adelaide/index.html': 'https://zqremovals.au/furniture-removalists-adelaide/',
    'office-removals-adelaide/index.html': 'https://zqremovals.au/office-removals-adelaide/',
    'removalists-salisbury/index.html': 'https://zqremovals.au/removalists-salisbury/',
    'adelaide-moving-guides/removalists-cost-adelaide/index.html': 'https://zqremovals.au/adelaide-moving-guides/removalists-cost-adelaide/',
}

updated = 0
for page in pages:
    output = page['output']
    if output not in FAQ_DATA:
        continue

    faqs = FAQ_DATA[output]
    page_url = PAGE_URL_MAP[output]
    faq_schema = make_faq_schema(faqs, page_url)
    faq_json_str = json.dumps({"@context": "https://schema.org", **faq_schema}, indent=2, ensure_ascii=False)

    # Check if FAQPage already in existing jsonLd
    existing_ld = page.get('jsonLd', [])
    has_faq = any('FAQPage' in s for s in existing_ld)

    if has_faq:
        # Replace existing FAQPage block
        new_ld = [s for s in existing_ld if 'FAQPage' not in s]
        new_ld.append(faq_json_str)
        page['jsonLd'] = new_ld
    else:
        page.setdefault('jsonLd', []).append(faq_json_str)

    updated += 1
    print(f"  Added FAQPage schema to: {output} ({len(faqs)} FAQs)")

print(f"\nSchema updated for {updated} pages")

with open('site-src/pages.json', 'w', encoding='utf-8') as f:
    json.dump(pages, f, indent=2, ensure_ascii=False)
    f.write('\n')

print('pages.json written successfully')
