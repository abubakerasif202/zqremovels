import { copyFile, cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { transform } from 'lightningcss';
import { buildCanonical, buildDescription, buildFAQSchema, buildImageObjectSchema, buildLocalBusinessSchema, buildOGTags, buildServiceSchema, buildTitle, buildTwitterTags, getGeneratedPages, getRouteCoverageReport, getSuburbLinkProfile, mergePagesByOutput, normalizeInternalHref, seoConfig } from '../site-src/data/seo-v4.mjs';

const workspaceRoot = process.cwd();

async function findProjectRoot() {
  const candidates = [workspaceRoot, path.join(workspaceRoot, 'Downloads', 'zq')];

  for (const candidate of candidates) {
    try {
      await stat(path.join(candidate, 'site-src', 'pages.json'));
      return candidate;
    } catch {
      // Try the next layout.
    }
  }

  return workspaceRoot;
}

const projectRoot = await findProjectRoot();
const srcRoot = path.join(projectRoot, 'site-src');
const distRoot = path.join(projectRoot, 'site-dist');

const templates = {
  standard: await readFile(path.join(srcRoot, 'templates', 'standard.html'), 'utf8'),
  bare: await readFile(path.join(srcRoot, 'templates', 'bare.html'), 'utf8'),
  redirect: await readFile(path.join(srcRoot, 'templates', 'redirect.html'), 'utf8'),
};

const partials = {
  header: await readFile(path.join(srcRoot, 'partials', 'header.html'), 'utf8'),
  footer: await readFile(path.join(srcRoot, 'partials', 'footer.html'), 'utf8'),
};

const staticPages = JSON.parse(await readFile(path.join(srcRoot, 'pages.json'), 'utf8'));
const generatedPages = getGeneratedPages();
const pages = mergePagesByOutput(staticPages, generatedPages);
const preferredSiteOrigin = seoConfig.siteUrl;
const legacySiteOrigin = seoConfig.siteUrl;
const defaultSocialImage = seoConfig.defaultOgImage;
const defaultLogoImage = seoConfig.defaultLogo;
const googleBusinessProfileUrl = 'https://share.google/Y04mpt9RTflWP3iRl';
const socialProfilePlaceholders = [
  'https://www.facebook.com/zqremovals',
  'https://www.instagram.com/zqremovals',
  'https://www.linkedin.com/company/zq-removals',
  'https://www.youtube.com/@zqremovals',
];
const companySameAsProfiles = Array.from(new Set([googleBusinessProfileUrl, ...socialProfilePlaceholders]));
const gaMeasurementId = process.env.VITE_GA_MEASUREMENT_ID?.trim() || '';
const gtmId = process.env.VITE_GTM_ID?.trim() || '';
const metaPixelId = process.env.VITE_META_PIXEL_ID?.trim() || '';
const googleSiteVerificationToken =
  process.env.GOOGLE_SITE_VERIFICATION?.trim() || '';
const SUBURB_PAGE_WORD_MIN = 600;
const SUBURB_PAGE_WORD_MAX = 900;
const SUBURB_CONDITION_HEADING_WORDS = 4;
const SUBURB_PADDING_PARAGRAPH =
  'Every move is reviewed for access, inventory, and timing before scheduling, so clients receive a practical plan supported by experienced local movers.';
const sourceMtimeCache = new Map();
const imageAssetExistsCache = new Map();
const heroImageRouteRules = {
  interstatePrefix: 'adelaide-to-',
  interstateKeyword: 'interstate',
  operationsOutputs: new Set([
    'office-removals-adelaide/index.html',
    'office-relocation-adelaide/index.html',
  ]),
  serviceOutputs: new Set([
    'packing-services-adelaide/index.html',
    'furniture-removalists-adelaide/index.html',
  ]),
  servicePrefix: 'adelaide-moving-guides/',
};

for (const page of pages) {
  normalizePageUrls(page);
}

const suburbPageProfiles = {
  'adelaide-cbd': {
    suburb: 'Adelaide CBD',
    nearby: 'North Terrace, King William Street, Rundle Mall, Grenfell Street, and Waymouth Street',
    h1: 'Adelaide CBD removalists for city apartments, offices, and tower relocations.',
    hero:
      'Adelaide CBD moves require planning around loading zones, booked lift windows, and high-traffic blocks, so the job is scoped around building access rather than guesswork.',
    intro: [
      'When people search for removalists in Adelaide CBD, they usually need more than a truck and a time slot. City jobs are shaped by concierge rules, service lift bookings, and strict loading times that can change the whole schedule. Our crew plans CBD relocations by confirming access details first, then matching labour and vehicle timing to the actual window available.',
      'We regularly move apartments, offices, and mixed-use spaces through the city grid where short travel distances still involve complex logistics. A move from one side of the CBD to the other can still become access-sensitive when parking is limited and elevators are shared with tenants. That is why we build each city move plan around entry points, carry distance, and timing pressure before move day starts.',
    ],
    conditions: [
      'Coordinating service-lift reservations and loading dock instructions before arrival',
      'Scheduling around city traffic peaks near North Terrace and King William Street',
      'Managing access limits in towers where dock time is fixed and strictly monitored',
    ],
    scenarios: [
      {
        title: 'Apartment tower relocations',
        copy:
          'CBD apartment moves often involve strict booking slots, service lift access, and shared loading areas. We sequence the load so priority furniture goes first, protect common areas, and keep the unload moving inside the approved window.',
      },
      {
        title: 'Office and suite transitions',
        copy:
          'Businesses moving around Grenfell Street or Waymouth Street usually need downtime control. We stage desks, monitors, archived files, and equipment by zone so teams can reset faster without unnecessary disruption.',
      },
      {
        title: 'City-to-suburb handovers',
        copy:
          'A CBD departure to wider Adelaide can involve tight pickup access followed by a longer suburban unload. We plan both ends together so the city constraints do not delay the final delivery and placement.',
      },
    ],
    trust: [
      'ZQ Removals is trusted by Adelaide clients who need experienced city movers that understand how CBD buildings actually operate. We provide clear communication, careful handling, and practical staging from first call to handover.',
      'Our team works across local routes, specialist furniture handling, and interstate departures, so your plan can scale if the move brief changes. The same disciplined approach is used whether the route is one city block or a multi-stop relocation.',
    ],
    services:
      'If you are comparing options, you can review our broader Adelaide service coverage, specialist packing and furniture support, and interstate pathways before submitting your brief.',
  },
  glenelg: {
    suburb: 'Glenelg',
    nearby: 'Jetty Road, Brighton Road, Colley Terrace, Anzac Highway, and Moseley Square',
    h1: 'Glenelg removalists for coastal apartments, homes, and beachside moves.',
    hero:
      'Glenelg moves need coastal access planning, parking awareness, and tighter sequencing for apartments, townhouses, and homes near busy beachside routes.',
    intro: [
      'People booking removalists in Glenelg are usually balancing lifestyle properties with practical access constraints. Streets near Jetty Road and Colley Terrace can be active throughout the day, and that changes how trucks are positioned and how quickly loading can begin. We scope each move around parking reality, entry width, and item profile so the plan fits the suburb.',
      'Glenelg also includes a mix of apartments, older homes, renovated townhouses, and small mixed-use sites. That variety means no two jobs run exactly the same way. Our approach is to map loading order to the property layout, confirm path-of-travel risks early, and keep the move predictable from pickup through placement.',
    ],
    conditions: [
      'Planning around beachside traffic flow near Jetty Road and Brighton Road',
      'Managing shared access in apartment and townhouse developments',
      'Adjusting staging for coastal properties with tighter frontage or longer carries',
    ],
    scenarios: [
      {
        title: 'Beachside apartment access',
        copy:
          'Apartment jobs in Glenelg can include shared corridors, tight lifts, and fixed unloading points. We align labour and sequence to reduce congestion and protect common areas while keeping the timeline realistic.',
      },
      {
        title: 'Family home and townhouse moves',
        copy:
          'Home moves around Brighton Road and nearby streets often involve mixed furniture sizes and varied room layouts. We prepare the load plan to avoid double handling and keep placement efficient at destination.',
      },
      {
        title: 'Local plus interstate planning',
        copy:
          'Some Glenelg clients move locally first and then send part of the load interstate. We can structure the brief so packing, protection, and transfer steps are consistent across both legs.',
      },
    ],
    trust: [
      'ZQ Removals is selected by many Adelaide families and professionals because we combine careful handling with practical route planning. Our experienced movers understand how coastal timing and access can affect labour if ignored.',
      'We focus on honest scoping, fixed-price clarity, and responsive communication, so clients know what to expect before move day. That consistency matters when moving fragile or high-value household items near busier coastal strips.',
    ],
    services:
      'You can also compare our full Adelaide local moving service, dedicated packing help, furniture-specific handling, office relocations, and interstate moving support.',
  },
  norwood: {
    suburb: 'Norwood',
    nearby: 'The Parade, Magill Road, Portrush Road, Fullarton Road, and Osmond Terrace',
    h1: 'Norwood removalists for terraces, townhouses, and eastern corridor moves.',
    hero:
      'Norwood moves are often terrace or apartment sensitive, with tighter street access and mixed residential-commercial conditions that need precise planning.',
    intro: [
      'Searching for removalists in Norwood usually means you are moving through streets where access can change block by block. Around The Parade and Magill Road, parking position and carry distance can quickly affect time on site. We plan each move by confirming those variables in advance so labour and timing are based on real conditions.',
      'Norwood routes can include heritage-style homes, modern apartments, family residences, and shopfront or office-adjacent properties. Instead of using generic assumptions, we stage by property type and inventory mix, then set a clear order for loading and placement. That keeps the move stable even when access is tighter than expected.',
    ],
    conditions: [
      'Reviewing frontage access and parking options near The Parade and Osmond Terrace',
      'Preparing for stairs, narrow entries, and corridor constraints in older properties',
      'Sequencing mixed residential and small-business inventory where required',
    ],
    scenarios: [
      {
        title: 'Terrace and heritage-style moves',
        copy:
          'Norwood terraces can involve constrained entries and careful turning space. We pre-plan furniture flow so heavier items are moved safely without unnecessary reshuffling inside the property.',
      },
      {
        title: 'Apartment and unit relocations',
        copy:
          'Apartment jobs around Portrush Road and Fullarton Road often depend on shared access rules. We confirm lift or corridor details early and build a move plan that protects common areas while staying efficient.',
      },
      {
        title: 'Retail and office-adjacent transfers',
        copy:
          'When a move includes stock, shelving, desks, or point-of-sale equipment, sequence matters. We structure the load so business-critical items are easier to reset at destination.',
      },
    ],
    trust: [
      'ZQ Removals is trusted across Adelaide for careful handling, disciplined planning, and reliable move-day communication. Our experienced team works with routes where access detail is as important as the inventory itself.',
      'We support local and interstate moves from the same operational standard, so clients can keep one trusted provider if the scope expands. That helps reduce risk when timelines and property conditions are changing.',
    ],
    services:
      'For planning support, review our Adelaide local moving page, packing services, office removals, furniture movers, and interstate removals before requesting your quote.',
  },
  salisbury: {
    suburb: 'Salisbury',
    nearby: 'Salisbury Highway, Commercial Road, Park Terrace, John Street, and Saints Road',
    eyebrow: 'Removalists Salisbury SA',
    h1: 'Salisbury removalists for homes, storage transfers, and northern Adelaide moves.',
    hero:
      'Salisbury moves often combine family homes, units, and storage-linked jobs where route timing and load sequencing make the biggest difference.',
    highlights: [
      'Family homes, units, and storage-linked moves',
      'Garage items and mixed loads scoped before quoting',
      'Fixed-price quotes that reflect access and inventory',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Salisbury is the right starting point for your quote',
      intro:
        'Use this page when Salisbury is one end of the move and the brief includes storage, garage items, or any access detail that could change labour time.',
      points: [
        'Pickup or delivery is in Salisbury or the nearby northern corridor',
        'You have storage cages, garages, or mixed household and stock inventory',
        'Parking, carry distance, stairs, or timing windows need to be accounted for early',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-northern-adelaide/', label: 'Northern Adelaide movers and planning notes' },
      { href: '/removalists-elizabeth/', label: 'Elizabeth removalists' },
      { href: '/removalists-mawson-lakes/', label: 'Mawson Lakes removalists' },
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm removalists' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'People looking for removalists in Salisbury usually want a straightforward move with no surprises. In practice, northern suburb routes can still become complex when access, storage transfers, or mixed inventory are not scoped early. We review the full brief before pricing so the plan matches the actual load and destination conditions.',
      'From properties near Commercial Road to surrounding streets feeding into Salisbury Highway, parking setup and carry distance can shift labour time even on short routes. Our process is to confirm property access, list key items, and stage by priority so unloading runs smoothly at the new address.',
    ],
    conditions: [
      'Planning driveway and street positioning for home and unit pickups',
      'Sequencing storage cage or garage items with household furniture',
      'Keeping suburb-to-suburb timing realistic during northern corridor traffic',
    ],
    scenarios: [
      {
        title: 'Home and unit relocations',
        copy:
          'Salisbury home moves often involve a mix of standard furniture, whitegoods, and outdoor items. We organise the load order so heavy and fragile pieces are handled with fewer interruptions.',
      },
      {
        title: 'Storage transfer combinations',
        copy:
          'Some clients need a direct move plus a storage stop in the same run. We map pickup, transfer, and final delivery in one sequence to avoid repeat handling and time loss.',
      },
      {
        title: 'Small business inventory moves',
        copy:
          'If the brief includes shelves, archives, or office furniture, we isolate those items in the plan so business assets are easier to place and restart at destination.',
      },
    ],
    trust: [
      'ZQ Removals is known for practical planning, careful handling, and clear communication across Adelaide’s north. Our experienced movers focus on predictability, not rushed assumptions.',
      'Clients choose us when they want a quote that reflects real access and inventory conditions. That trust is built by consistent move-day execution and transparent updates from booking through handover.',
    ],
    services:
      'Before booking, explore our Adelaide local removals, packing assistance, office relocations, furniture moving service, and interstate removals support.',
  },
  gawler: {
    suburb: 'Gawler',
    nearby: 'Murray Street, Adelaide Road, Main North Road, and the surrounding northern townships',
    eyebrow: 'Removalists Gawler SA',
    h1: 'Gawler removalists for house moves, units, and organised northside relocations.',
    hero:
      'Gawler moves often mix family homes, newer estates, and garage-heavy loads where driveway access, stairs, and longer northern timing all affect the plan.',
    highlights: [
      'House removals in Gawler scoped around access and inventory',
      'Bulky items like sofas and beds handled with clearer staging',
      'Fixed-price quotes built from a real move brief',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Gawler move planning needs more detail',
      intro:
        'Use this page when your move is based in Gawler and you want the quote to reflect stairs, driveway access, garage loads, and any business or storage component.',
      points: [
        'Pickup or delivery is in Gawler or the surrounding northern corridor',
        'Your move includes bulky furniture, whitegoods, or garage inventory',
        'You want packing or a staged plan included before move day',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-blakeview/', label: 'Blakeview removalists' },
      { href: '/removalists-northern-adelaide/', label: 'Northern Adelaide movers and planning notes' },
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm removalists' },
      { href: '/removalists-salisbury/', label: 'Salisbury removalists' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'When people search for removalists in Gawler, they are usually balancing two needs: a smooth local move and a quote that does not ignore the real labour involved. Northern township moves can still run long when access is tight, the inventory is fuller, or fragile furniture needs a stronger protection standard. We review the brief properly before confirming the quote so the plan matches the property and the load.',
      'Gawler also has a wide mix of property types, from tighter townhouse layouts to larger family homes with sheds, outdoor settings, and heavier garage items. The most reliable moves here are the ones where access notes, carry distance, and any awkward pieces like sofas, beds, or heavier whitegoods are surfaced early, not discovered on the day.',
    ],
    conditions: [
      'Allowing for double-storey stairs, narrow hallways, and tighter turning space in townhouse layouts',
      'Planning parking position and carry distance where street access is busy or constrained',
      'Sequencing garage items, outdoor furniture, and heavier pieces so the load stays stable and protected',
    ],
    scenarios: [
      {
        title: 'House moves with garage loads',
        copy:
          'Gawler house moves often include sheds, garages, and outdoor pieces alongside the main household furniture. We structure the load so heavy items and delicate pieces are handled once and staged safely.',
      },
      {
        title: 'Townhouse and estate relocations',
        copy:
          'Newer estate moves can involve narrow streets, multi-car driveways, and tighter internal access. We plan the entry path and placement order so unloads stay efficient and predictable.',
      },
      {
        title: 'Small office and stock transfers',
        copy:
          'Some moves include desks, archives, shelving, or lighter business stock. When that is part of the brief, we separate those items in the plan so the reset is faster at the destination.',
      },
    ],
    trust: [
      'ZQ Removals supports Gawler clients who want careful handling and clear communication without the templated quote approach. We scope access and inventory early so the move day is less chaotic.',
      'If the route expands beyond Adelaide or needs packing support, the same quoting process can cover local, office, furniture, packing, and interstate requirements in one brief.',
    ],
    services:
      'Review our Adelaide removals hub, packing services, office relocations, furniture movers, and interstate removals coverage to match your move type before requesting a fixed-price quote.',
  },
  'elizabeth-vale': {
    suburb: 'Elizabeth Vale',
    nearby: 'the northern corridors around Main North Road and the Elizabeth / Salisbury region',
    eyebrow: 'Removalists Elizabeth Vale',
    h1: 'Elizabeth Vale removalists for units, townhouses, and northside house moves.',
    hero:
      'Elizabeth Vale moves are often shaped by unit access, shared driveways, and mixed household inventory where a clear brief keeps the day running smoothly.',
    highlights: [
      'Unit and townhouse access reviewed before quoting',
      'Packing and moving services available when timelines are tight',
      'Fixed-price quotes built around real access and inventory',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Elizabeth Vale is the right place to start',
      intro:
        'Use this page if Elizabeth Vale is part of the route and access details like shared entries, stairs, or parking will influence timing and handling.',
      points: [
        'You are moving to or from Elizabeth Vale (unit, townhouse, or home)',
        'You have heavier or fragile items that should be quoted properly',
        'You want packing support included in the same plan and quote',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-elizabeth/', label: 'Elizabeth removalists' },
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm removalists' },
      { href: '/removalists-salisbury/', label: 'Salisbury removalists' },
      { href: '/removalists-northern-adelaide/', label: 'Northern Adelaide movers and planning notes' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'People booking removalists in Elizabeth Vale usually want the job handled efficiently without losing care around heavier or fragile furniture. The main differences here tend to be access: units, shared entries, tighter parking, and longer carries that can add labour time quickly if they are not scoped early. We build the plan around those details before the quote is confirmed.',
      'Elizabeth Vale also sits inside a broader northside moving corridor, so some briefs involve storage transfers, family home moves, or a route that links into Salisbury, Andrews Farm, and neighbouring suburbs. When the suburb is known, we recommend capturing the access notes and the item profile up front so the proposal stays realistic and the move day stays organised.',
    ],
    conditions: [
      'Reviewing unit and townhouse access, including shared entries, stairs, and parking position',
      'Flagging heavier or awkward items early so handling and load order stay controlled',
      'Allowing for northside timing where the route includes storage stops or multiple addresses',
    ],
    scenarios: [
      {
        title: 'Unit and townhouse relocations',
        copy:
          'Elizabeth Vale units and townhouses can be access-sensitive when stairs or longer carries are involved. We confirm the path out and stage the load so bulky furniture and fragile items are protected properly.',
      },
      {
        title: 'Family homes with fuller inventories',
        copy:
          'Some Elizabeth Vale moves include larger households, garage items, or outdoor settings. We map the inventory and room priorities early so the unload sequence is easier at the new address.',
      },
      {
        title: 'Packing and moving support',
        copy:
          'If you want packing and moving services combined, we can scope the packing brief with the move so fragile rooms and delicate pieces are prepared before the truck arrives.',
      },
    ],
    trust: [
      'ZQ Removals works across Adelaide’s north with a planning-first approach, so clients get a quote that reflects the real access and inventory conditions instead of a guess.',
      'If the move changes into an office relocation or an interstate departure, the same quoting process can carry the full brief through without starting from scratch.',
    ],
    services:
      'Compare local Adelaide removals, packing services, furniture moving support, office relocations, and interstate removals so the quote matches the move type from the start.',
  },
  'elizabeth-downs': {
    suburb: 'Elizabeth Downs',
    nearby: 'the local streets feeding into Elizabeth, Main North Road, and the broader northern suburbs',
    eyebrow: 'Removalists Elizabeth Downs',
    h1: 'Elizabeth Downs removalists for family homes, garage loads, and northside moves.',
    hero:
      'Elizabeth Downs moves often involve full household loads and garage items where driveway access, parking position, and handling order make a noticeable difference.',
    highlights: [
      'Family-home moves with fuller inventories and garage items',
      'Short-notice move briefs assessed with clearer access notes',
      'Fixed-price quotes built around the real load and route',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Elizabeth Downs moves need a tighter brief',
      intro:
        'Use this page when Elizabeth Downs is part of the route and you want a quote that accounts for heavier items, garage inventory, stairs, or access constraints.',
      points: [
        'You are moving within Adelaide’s northside corridor',
        'The inventory includes heavier furniture, whitegoods, or outdoor items',
        'You want the quote to reflect parking, carry distance, and timing windows',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-elizabeth/', label: 'Elizabeth removalists' },
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm removalists' },
      { href: '/removalists-salisbury/', label: 'Salisbury removalists' },
      { href: '/removalists-northern-adelaide/', label: 'Northern Adelaide movers and planning notes' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'If you are searching for removalists in Elizabeth Downs, the move is usually straightforward when the access and inventory are captured early. Where these jobs get harder is when heavier pieces, garage stock, or tighter parking turns a simple route into a slow day. We review those variables before quoting so the plan stays realistic and the crew arrives with the right expectations.',
      'Elizabeth Downs sits within Adelaide’s northside corridor, so some moves also connect to Andrews Farm, Salisbury, and other nearby areas where timing and access change street-by-street. The cleanest way to keep the move affordable is to tighten the brief early: list the larger items, note stairs or longer carries, and confirm any fragile handling needs before booking.',
    ],
    conditions: [
      'Checking driveway width, street parking, and carry distance so loading time is not underestimated',
      'Sequencing garage and outdoor items with household furniture to reduce double handling',
      'Planning for stairs, tight corners, and heavier pieces that need slower handling and better protection',
    ],
    scenarios: [
      {
        title: 'Family homes and garage-heavy loads',
        copy:
          'Elizabeth Downs moves often include larger furniture profiles plus garage items and outdoor pieces. We plan the load so heavy items move safely and fragile pieces stay protected.',
      },
      {
        title: 'Short-notice move windows',
        copy:
          'When timing is tight, a clear brief matters even more. We focus on access notes and priority items first so the plan stays usable and the delivery side is easier to manage.',
      },
      {
        title: 'Storage or multi-stop days',
        copy:
          'If the route includes a storage stop or a second address, we map the sequence early so the load does not need to be reshuffled during the day.',
      },
    ],
    trust: [
      'ZQ Removals is chosen by northside clients who want careful handling with a quote that reflects real access and inventory, not a generic headline number.',
      'We keep communication simple and practical so households and teams know what to expect before move day and during the handover.',
    ],
    services:
      'Review the Adelaide local removals hub, packing services, furniture handling, office relocations, and interstate removals coverage before sending your quote request.',
  },
  blakeview: {
    suburb: 'Blakeview',
    nearby: 'Blakeview estates, nearby northside suburbs, and the Gawler corridor',
    eyebrow: 'Removalists Blakeview SA',
    h1: 'Blakeview removalists for estate moves, home shifting, and northside relocations.',
    hero:
      'Blakeview moves often involve newer estates, tighter street parking, and room-by-room setup priorities where the brief needs to be organised early.',
    highlights: [
      'Estate street access and driveway setup planned before quoting',
      'Bulky furniture and fragile finishes handled with clearer staging',
      'Fixed-price quotes for Blakeview moves based on the brief',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When a Blakeview move needs more planning',
      intro:
        'Use this page when Blakeview is part of the route and access, stairs, or tight timelines mean the brief needs to be organised early.',
      points: [
        'The property is inside a newer estate with limited street parking',
        'Stairs, narrow hallways, or awkward turning points affect bulky items',
        'You want packing support included so fragile rooms are protected properly',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-gawler/', label: 'Gawler removalists' },
      { href: '/removalists-northern-adelaide/', label: 'Northern Adelaide movers and planning notes' },
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm removalists' },
      { href: '/removalists-salisbury/', label: 'Salisbury removalists' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'Blakeview is a suburb where the move can look simple on paper but still depend on practical access details: driveway position, narrow streets, multiple cars, and tight internal turns in modern layouts. We scope those details before quoting so the plan stays efficient and the day does not get slowed down by avoidable bottlenecks.',
      'Customers also ask for help with home shifting services in Blakeview when the move needs to happen cleanly inside a narrow timing window. The best way to support that is to keep the brief specific: confirm access, list heavier items, and call out any rooms or pieces that should be delivered first at the new property.',
    ],
    conditions: [
      'Planning parking and truck position in estates where street space is limited or shared',
      'Allowing for double-storey stairs, tighter hallways, and awkward turning points for bulky furniture',
      'Keeping room priorities clear so the unload order matches the way you will use the new home first',
    ],
    scenarios: [
      {
        title: 'Estate home moves with stairs',
        copy:
          'Blakeview moves often include double-storey stairs and larger furniture that needs controlled handling. We confirm access and stage the load to protect bulky items and fragile finishes.',
      },
      {
        title: 'Business and home-linked relocations',
        copy:
          'Some briefs include a home move plus a small business relocation component, like shelving, archives, or work equipment. We isolate those items so they are easier to place and restart at destination.',
      },
      {
        title: 'Packing and protection support',
        copy:
          'When fragile rooms or delicate furniture are part of the inventory, packing support can be scoped with the move so preparation is handled properly before move day.',
      },
    ],
    trust: [
      'ZQ Removals supports Blakeview clients who want a careful move plan with clear communication and disciplined handling from booking through handover.',
      'If the move becomes office-related or interstate, the same quoting process can cover those requirements without losing detail or resetting the brief.',
    ],
    services:
      'Use our Adelaide removals hub, packing services, office relocations, furniture movers, and interstate removals pages to match the quote request to the real move type.',
  },
  'northern-adelaide': {
    suburb: 'Northern Adelaide',
    nearby: 'Salisbury, Elizabeth, Andrews Farm, Mawson Lakes, Blakeview, and Gawler',
    eyebrow: 'Removalists Northern Suburbs Adelaide',
    h1: 'Removalists Northern Suburbs Adelaide for family homes, estates, and northside coverage.',
    hero:
      'Northern Adelaide moves often involve family homes, estates, and unit access where driveway setup, stairs, and garage inventory change labour time quickly.',
    highlights: [
      'Northside moves scoped around access, stairs, and parking',
      'Urgent timelines assessed with clear brief details',
      'Packing, office, and furniture support available when needed',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Adelaide north move planning should start here',
      intro:
        'Use this page when your route touches multiple northern suburbs or you want a northside-focused quote that reflects access, inventory, and timing pressure.',
      points: [
        'Your move is within Adelaide’s northside corridor or crosses multiple northern suburbs',
        'You need a plan that accounts for garage items, stairs, and mixed inventory',
        'You may need packing support or an office component included in the same brief',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-salisbury/', label: 'Salisbury removalists' },
      { href: '/removalists-elizabeth/', label: 'Elizabeth removalists' },
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm removalists' },
      { href: '/removalists-mawson-lakes/', label: 'Mawson Lakes removalists' },
      { href: '/removalists-blakeview/', label: 'Blakeview removalists' },
      { href: '/removalists-gawler/', label: 'Gawler removalists' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'When people search for removalists in Adelaide north, they are usually looking for a team that can move quickly without turning the day into a rushed job. The safest way to do that is not to guess. It is to confirm access, capture the inventory profile, and stage the load so heavier and fragile items are handled properly from the first lift.',
      'This northside page is a practical starting point when your route touches multiple northern suburbs or you are comparing areas like Salisbury, Elizabeth, and Gawler. If the suburb is known and has specific access constraints, the suburb pages are a better match. If the brief is still broad, use this page to frame the key details before requesting the fixed-price quote.',
    ],
    conditions: [
      'Reviewing driveways, street parking, and carry distance across estate-style and family-home routes',
      'Planning for stairs, unit access, and shared entries that can slow loading if not scoped early',
    ],
    scenarios: [
      {
        title: 'Family homes and estate relocations',
        copy:
          'Northside home moves often include fuller inventories and garage items. We organise the brief so the loading order and room priorities stay clear from start to finish.',
      },
      {
        title: 'Short-notice local moves',
        copy:
          'If the move timeline is tight, send the key details early. Same-day availability depends on scheduling, but urgent briefs are easier to assess when access and larger items are clearly listed.',
      },
      {
        title: 'Small office and mixed-load moves',
        copy:
          'Some northern moves include office furniture, archives, or small business stock. We plan those items separately so the new site can reset faster and with less disruption.',
      },
    ],
    trust: [
      'ZQ Removals supports northern Adelaide routes with a planning-first standard so quotes reflect real access and inventory conditions, not generic assumptions.',
      'We provide local Adelaide moves, office relocations, furniture handling, packing support, and interstate routes from the same quoting process so the brief stays coherent even if the scope changes.',
    ],
    services:
      'For next steps, explore the Salisbury, Elizabeth, Andrews Farm, Blakeview, and Gawler suburb pages, plus our packing services, office removals, furniture moving support, and interstate removals hubs.',
  },
  marion: {
    suburb: 'Marion',
    nearby: 'Sturt Road, Marion Road, Morphett Road, and the southern residential corridor',
    eyebrow: 'Removalists Marion SA',
    h1: 'Marion removalists for house moves, units, and southern Adelaide relocations.',
    hero:
    'Marion moves often combine family homes, units near the shopping precinct, and southern routes where parking and access vary block by block.',
    highlights: [
    'Southern family homes and units scoped before quoting',
    'Parking and access reviewed for moves near busy corridors',
    'Fixed-price quotes that reflect real move conditions',
    ],
    startHere: {
    eyebrow: 'When to use this page',
    heading: 'When Marion is your starting point',
    intro:
      'Use this page if you are moving in the Marion area and want a quote that accounts for unit access, southern corridor traffic, or larger family inventories.',
    points: [
      'You are moving to or from Marion or nearby southern suburbs',
      'The inventory includes a mix of household items and outdoor settings',
      'Access details like stairs or shared driveways need to be planned early',
    ],
    },
    nearbyLinks: [
    { href: '/removalists-southern-adelaide/', label: 'Southern Adelaide removals' },
    { href: '/removalists-hallett-cove/', label: 'Hallett Cove removalists' },
    { href: '/removalists-morphett-vale/', label: 'Morphett Vale removalists' },
    { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'Looking for removalists in Marion usually means you want a local crew that understands southern access. From the busy intersections near the Westfield precinct to quieter residential streets, the way a truck is positioned can change the whole day. We review your specific address and inventory so the plan is tailored to the real logistics of your move.',
      'Marion routes often include a variety of property types—traditional family homes, modern townhouses, and apartment units. Each one brings different challenges, whether it is narrow hallways, shared driveways, or multiple levels of stairs. We stage the load so your most important items are protected and the unload is as efficient as possible.',
    ],
    conditions: [
      'Managing southern traffic flow near the Westfield Marion shopping precinct',
      'Coordinating driveway access for townhouses and units with shared entries',
      'Staging furniture for family homes where stairs and narrow halls change timing',
    ],
    scenarios: [
      {
        title: 'Southern family-home relocations',
        copy:
          'Marion family moves often involve fuller inventories and garden items. We organise the truck load so your most used furniture is placed correctly at the new home while larger items are safely secured.',
      },
      {
        title: 'Unit and townhouse transitions',
        copy:
          'For units near busy southern corridors, we plan the loading window and vehicle position to reduce carry distance and keep the move moving without blocking shared access paths.',
      },
    ],
    trust: [
      'ZQ Removals is chosen for southern Adelaide moves because we focus on real planning. We provide fixed quotes that reflect your actual inventory and access details.',
      'Our team is experienced across local house moves, office relocations, and packing services, ensuring your southern relocation is handled with professional care.',
    ],
    services:
      'Explore our full Adelaide suburb coverage, packing services, and southern service hubs to see how we plan for moves like yours.',
  },
  'mawson-lakes': {
    suburb: 'Mawson Lakes',
    nearby: 'Main North Road, Mawson Lakes Boulevard, and the northern university and residential precinct',
    eyebrow: 'Removalists Mawson Lakes',
    h1: 'Mawson Lakes removalists for modern homes, apartments, and northern relocations.',
    hero:
      'Mawson Lakes moves often involve modern multi-storey layouts, tighter street parking, and precinct-specific access rules that need early planning.',
    highlights: [
      'Modern home and apartment access reviewed before move day',
      'Parking and loading windows planned for precinct moves',
      'Clear quoting that accounts for stairs and tight layouts',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Mawson Lakes move planning starts here',
      intro:
        'Use this page for Mawson Lakes moves where multi-level stairs, tight street access, or precinct rules will shape the quote and plan.',
      points: [
        'Moving within the Mawson Lakes residential or university precinct',
        'Handling fragile or modern furniture through tighter internal layouts',
        'Requiring a fixed-price quote based on specific property access',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-salisbury/', label: 'Salisbury removalists' },
      { href: '/removalists-northern-adelaide/', label: 'Northern Adelaide removals' },
      { href: '/removalists-adelaide-cbd/', label: 'Adelaide CBD planning' },
    ],
    intro: [
      'Removalists in Mawson Lakes need to be prepared for the specific layout of the suburb. Many homes here feature modern, multi-storey designs with tighter internal stairs and narrow street frontages. We plan the carry path and load sequence to ensure your furniture is handled safely without slowing down the move or risking damage to the property.',
      'The precinct also includes a high density of apartments and townhouses where parking for larger vehicles can be a challenge. We coordinate with you to find the best loading position and timing window, reducing the carry distance and keeping the overall cost of your Mawson Lakes move more predictable.',
    ],
    conditions: [
      'Navigating modern multi-storey layouts with tight internal staircases',
      'Planning for limited street parking and vehicle height restrictions in precincts',
      'Scheduling moves around university and residential high-traffic windows',
    ],
    scenarios: [
      {
        title: 'Modern townhouse relocations',
        copy:
          'Mawson Lakes townhouses often have three levels and narrow entries. We use specialized equipment and careful staging to move large pieces safely through vertical layouts.',
      },
      {
        title: 'Apartment and precinct moves',
        copy:
          'For moves inside the core residential precinct, we coordinate loading zones and lift usage early so your move stays on track without interfering with neighbours.',
      },
    ],
    trust: [
      'We understand the specific architecture and access patterns of Mawson Lakes, providing quotes that are accurate for modern property types.',
      'ZQ Removals maintains high standards for furniture protection and professional service across all northern Adelaide routes.',
    ],
    services:
      'Review our northern Adelaide removals hub, packing guides, and office relocation services for more planning support.',
  },
  elizabeth: {
    suburb: 'Elizabeth',
    nearby: 'Main North Road, Elizabeth Way, and the surrounding northern residential blocks',
    eyebrow: 'Removalists Elizabeth SA',
    h1: 'Elizabeth removalists for family homes, units, and northern corridor moves.',
    hero:
      'Elizabeth moves often involve full household loads, garage items, and northern routes where driveway access and inventory depth matter most.',
    highlights: [
      'Full-home and garage-heavy moves scoped early',
      'Northern corridor expertise for local and longer routes',
      'Fixed-price clarity based on your real inventory list',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Elizabeth is your move origin or destination',
      intro:
        'Use this page when moving in the Elizabeth area and you want a quote that reflects full household volumes, garage items, or northern access conditions.',
      points: [
        'Moving house or unit in the Elizabeth and northern region',
        'Large inventory including bulky furniture and outdoor settings',
        'Need for a reliable, fixed-price quote with no hidden extras',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-salisbury/', label: 'Salisbury removalists' },
      { href: '/removalists-andrews-farm/', label: 'Andrews Farm removalists' },
      { href: '/removalists-northern-adelaide/', label: 'Northern Adelaide removals hub' },
    ],
    intro: [
      'Finding reliable removalists in Elizabeth means looking for a team that can handle full-sized family moves. With many properties featuring established gardens, sheds, and garages, the inventory list is often broader than a city apartment. We take the time to understand everything you are moving so we can provide the right truck and crew for the job.',
      'Elizabeth moves are also part of the wider northern Adelaide corridor. Whether you are moving just a few streets away or across to another part of the north, we plan the route to avoid traffic bottlenecks and ensure a smooth transition. Our focus is on practical, honest service that gets your home shifted with care.',
    ],
    conditions: [
      'Managing full household inventories with significant garage and outdoor items',
      'Assessing driveway access and parking for larger removal trucks',
      'Planning routes along Main North Road to avoid peak traffic delays',
    ],
    scenarios: [
      {
        title: 'Established family-home moves',
        copy:
          'For traditional Elizabeth homes, we focus on organized packing and loading of large furniture, outdoor settings, and storage items for a seamless handover.',
      },
      {
        title: 'Northern corridor transfers',
        copy:
          'If you are moving within the Elizabeth, Salisbury, or Gawler regions, we use our local knowledge to ensure the most efficient route and timing for your day.',
      },
    ],
    trust: [
      'ZQ Removals provides honest, hard-working service for northern Adelaide families who value clear pricing and careful handling.',
      'Every quote is fixed and based on the brief you provide, ensuring no surprises when the truck arrive.',
    ],
    services:
      'Check out our northern Adelaide hubs, packing services, and furniture moving tips for more help with your Elizabeth move.',
  },
  'removalists-adelaide/index.html': {
    suburb: 'Adelaide',
    nearby: 'all metropolitan Adelaide suburbs and regional South Australia routes',
    hero:
      'Adelaide removals work best when local route knowledge and property access are planned together. We provide fixed-price quotes for house moves, office relocations, and furniture handling across the metro area.',
    intro: [
      'Finding the right removalists in Adelaide means looking for a crew that can handle more than just a truck route. From character homes in the inner east to modern apartments in the CBD, every property type requires a different load sequence and access strategy. We review the brief first so your move day is predictable and professionally managed.',
      'Our Adelaide service coverage spans the entire metropolitan region and extends to regional SA. Whether you are moving from the northern suburbs to the south, or just shifting a few streets away, we plan for traffic windows, parking constraints, and inventory depth to keep the overall move time efficient and safe.',
    ],
    conditions: [
      'Reviewing metropolitan traffic windows and parking zone restrictions',
      'Coordinating multi-level access, service lifts, and driveway constraints',
      'Planning for diverse inventory profiles from apartments to large family homes',
    ],
    scenarios: [
      {
        title: 'Metropolitan house moves',
        copy:
          'For moves across Adelaide suburbs, we focus on efficient routing and careful load protection. We organize the truck to match your destination room layout for a faster setup.',
      },
      {
        title: 'Office and commercial relocations',
        copy:
          'Adelaide business moves require strict timing and workstation coordination. We plan commercial briefs around your operational windows to minimize downtime.',
      },
    ],
    trust: [
      'ZQ Removals is a locally owned Adelaide business focused on fixed-price clarity and professional moving standards.',
      'We maintain a consistent crew and a reliable fleet to ensure every Adelaide move is handled with the same high level of care.',
    ],
    services:
      'For next steps, compare our eastern Adelaide suburb coverage, the Adelaide removalist cost guide, packing services, and local furniture moving support.',
  },
  marion: {
    suburb: 'Marion',
    nearby: 'Marion Road, Sturt Road, Diagonal Road, Morphett Road, and Oaklands Road',
    h1: 'Marion removalists for homes, units, clinics, and offices.',
    hero:
      'Marion moves often blend home, unit, clinic, and office requirements where access, traffic timing, and item sequencing all need careful planning.',
    intro: [
      'People booking removalists in Marion are often moving through busier south-west corridors where travel timing and site access both matter. Streets linked by Marion Road, Sturt Road, and Diagonal Road can add pressure if the route is not planned in detail. We build each move around access points, inventory type, and unloading priorities.',
      'Marion also has diverse property types, including homes, apartments, townhouses, clinics, and small offices. That mix requires a practical loading strategy rather than a one-size-fits-all approach. Our crew scopes each job for handling risk, access complexity, and destination layout before finalising the move plan.',
    ],
    conditions: [
      'Planning around corridor traffic windows near Marion Road and Sturt Road',
      'Managing shared parking and access for units, clinics, and mixed-use sites',
      'Sequencing home and business items to reduce disruption at destination',
    ],
    scenarios: [
      {
        title: 'House and townhouse relocations',
        copy:
          'Family moves in Marion often include a blend of bulky furniture, boxed goods, and delicate items. We structure the load so placement is faster and handling quality stays high throughout the job.',
      },
      {
        title: 'Apartment and shared-access moves',
        copy:
          'Apartment runs near Morphett Road and Oaklands Road can involve shared entries and stricter loading conditions. We confirm those constraints early and match crew flow to the property setup.',
      },
      {
        title: 'Clinic and office transitions',
        copy:
          'When a move includes treatment rooms, reception assets, or workstations, sequencing is essential. We prioritise business-critical items so teams can restart operations with less downtime.',
      },
    ],
    trust: [
      'ZQ Removals is trusted across Adelaide for organised moving support, careful packing and handling, and consistent communication from quote to completion. Our experienced movers understand south-west route complexity.',
      'We focus on transparent scoping and practical execution so clients can make confident decisions early. Whether the move stays local or extends interstate, the same quality standards apply.',
    ],
    services:
      'To plan properly, review our Adelaide local removals, office relocation services, packing assistance, furniture movers, and interstate removals options.',
  },
  'morphett-vale': {
    suburb: 'Morphett Vale',
    nearby: 'South Road, Main South Road, Beach Road, States Road, and the southern corridor toward Reynella and Noarlunga',
    eyebrow: 'Removalists Morphett Vale',
    h1: 'Morphett Vale removalists for family homes, garages, and longer southern Adelaide moves.',
    hero:
      'Morphett Vale moves often involve larger family-home inventories, garage storage, and longer suburb-to-suburb routes where driveway access and loading order make the biggest difference.',
    highlights: [
      'Family homes, garages, and larger household inventories',
      'South-side routes scoped around access, stairs, and carry distance',
      'Packing, furniture handling, and interstate support available from one brief',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Morphett Vale is the right starting point',
      intro:
        'Use this page when Morphett Vale is one end of the move and the job includes family-home inventory, storage or garage items, or a longer southern corridor route that needs cleaner planning.',
      points: [
        'Pickup or delivery is in Morphett Vale or the nearby southern corridor',
        'The move includes garage stock, outdoor settings, whitegoods, or heavier furniture',
        'You want packing, furniture handling, or interstate support scoped in the same quote',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-southern-adelaide/', label: 'Southern Adelaide movers and planning notes' },
      { href: '/removalists-hallett-cove/', label: 'Hallett Cove removalists' },
      { href: '/removalists-seaford/', label: 'Seaford removalists' },
      { href: '/removalists-noarlunga/', label: 'Noarlunga removalists' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'People searching for removalists in Morphett Vale are usually planning a bigger household move rather than a simple small-load transfer. Family homes in this area often come with garage storage, outdoor furniture, whitegoods, and a route that stretches further across the southern corridor than the suburb name suggests. We review the inventory and the access path first so labour and timing are based on the real workload.',
      'Morphett Vale also sits between several southern Adelaide corridors, so the move can easily branch into Reynella, Seaford, Noarlunga, Marion, or an interstate departure. That makes sequencing more important. We plan the order around driveway access, stairs, heavier pieces, and any packing work so the pickup stays organised and the unload does not slow down once the truck arrives.',
    ],
    conditions: [
      'Reviewing driveway access, longer carries, and stairs before the quote is locked in',
      'Sequencing garage, shed, and outdoor items with the main household load',
      'Planning southern corridor timing when the move crosses multiple suburbs or extends interstate',
    ],
    scenarios: [
      {
        title: 'Family homes with garage inventory',
        copy:
          'Morphett Vale house moves often include garage shelving, outdoor settings, spare fridges, and larger whitegoods alongside the main home inventory. We stage those items early so the load stays protected and the truck space is used properly.',
      },
      {
        title: 'Townhouse and split-level routes',
        copy:
          'Some Morphett Vale jobs involve tighter internal turns, stair runs, and longer carries than expected. We review those access details before quoting so the crew arrives with the right labour plan.',
      },
      {
        title: 'Southern Adelaide to interstate departures',
        copy:
          'When the Morphett Vale pickup is the first leg of a longer route, the brief needs tighter packing, timing, and handover control. We keep that planning consistent from the Adelaide end through to the interstate service page.',
      },
    ],
    trust: [
      'ZQ Removals is chosen for southern Adelaide jobs where careful handling and practical route planning matter more than generic room-count quoting. We keep the brief specific so the move day stays controlled.',
      'The same move review can cover local relocations, heavier furniture handling, packing support, and interstate planning. That keeps the process simpler when the route becomes more complex than a standard suburb move.',
    ],
    services:
      'Before booking, compare our Southern Adelaide hub, house removals, packing services, furniture movers, and interstate planning pages if the route extends beyond a standard local run.',
  },
  noarlunga: {
    suburb: 'Noarlunga',
    nearby: 'Beach Road, Main South Road, Dyson Road, and the coastal-southern routes around Seaford and Port Noarlunga',
    eyebrow: 'Removalists Noarlunga',
    h1: 'Noarlunga removalists for coastal homes, units, storage moves, and southern business relocations.',
    hero:
      'Noarlunga moves often combine coastal access, unit or townhouse constraints, storage-linked jobs, and wider southern corridor timing that needs to be planned before the quote is final.',
    highlights: [
      'Coastal homes, units, and townhouse moves',
      'Storage-linked and mixed residential-business briefs',
      'Interstate-ready planning from the southern coastal corridor',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Noarlunga is the better suburb brief',
      intro:
        'Use this page when the move is based around Noarlunga and the route includes coastal access, storage, mixed-use inventory, or a southern business reset that needs more than a generic metro quote.',
      points: [
        'Pickup or delivery is in Noarlunga or the nearby southern coastal corridor',
        'The move includes units, townhouses, storage, stock, or mixed residential-commercial items',
        'Parking, access timing, packing, or interstate handover details need to be scoped early',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-southern-adelaide/', label: 'Southern Adelaide movers and planning notes' },
      { href: '/removalists-seaford/', label: 'Seaford removalists' },
      { href: '/removalists-glenelg/', label: 'Glenelg removalists' },
      { href: '/interstate-removals-adelaide/', label: 'Interstate removals Adelaide' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'People looking for removalists in Noarlunga are often juggling a route that mixes coastal living conditions with broader southern Adelaide travel. That can mean units with tighter access, homes with longer carries, storage transfers, or commercial stock that needs a cleaner sequence than a basic house move quote.',
      'Noarlunga also works as a transition point between local southern suburbs and longer Adelaide or interstate routes. We plan the move around where the truck can load, what needs better protection, and whether the day includes residential items, business equipment, or a staged handover to another destination.',
    ],
    conditions: [
      'Planning parking, loading, and timing for coastal and southern corridor properties',
      'Separating residential furniture, storage boxes, and light commercial stock in the move plan',
      'Using packing and route-specific handover notes when the brief extends beyond a standard local move',
    ],
    scenarios: [
      {
        title: 'Coastal homes and unit relocations',
        copy:
          'Noarlunga jobs can involve tighter access, shared entries, and mixed furniture sizes that benefit from a clearer loading order. We build the move around those constraints before the truck is booked.',
      },
      {
        title: 'Storage and mixed-load transfers',
        copy:
          'Some Noarlunga moves include storage cages, archived items, or stock alongside standard household furniture. We separate those components in the brief so the unload sequence stays practical at destination.',
      },
      {
        title: 'Southern business and interstate handovers',
        copy:
          'If the move includes business equipment or becomes the first leg of an interstate route, we align access, packing, and handover notes early so the later stages stay controlled.',
      },
    ],
    trust: [
      'ZQ Removals supports Noarlunga clients who want a suburb-specific brief that accounts for coastal access, mixed inventory, and wider southern Adelaide timing rather than relying on a vague metro quote.',
      'We keep the move review practical and adaptable, so the same plan can cover local houses, storage moves, lighter commercial jobs, and interstate departures when needed.',
    ],
    services:
      'Compare the Southern Adelaide hub, packing services, furniture movers, office relocations, and interstate planning pages if the route is more complex than a standard local move.',
  },
  reynella: {
    suburb: 'Reynella',
    nearby: 'Main South Road, Old South Road, Reynella East, Woodcroft, Happy Valley, and Morphett Vale',
    eyebrow: 'Removalists Reynella SA',
    h1: 'Reynella removalists for family homes, storage-linked loads, and southern corridor departures.',
    hero:
      'Reynella moves often sit at the junction between family-home logistics, storage or garage overflow, and longer southbound or interstate departure planning.',
    highlights: [
      'Family-home and townhouse moves reviewed around driveway access and split-level layouts',
      'Garage stock, whitegoods, and storage-linked items staged before the quote is fixed',
      'Useful for southern corridor moves that may later feed into interstate departures',
    ],
    startHere: {
      eyebrow: 'When to use this page',
      heading: 'When Reynella is the right starting point for the move brief',
      intro:
        'Use this page when Reynella is one end of the route and the move includes family-home inventory, driveway or stair constraints, storage overflow, or a southbound handover that needs cleaner sequencing.',
      points: [
        'Pickup or delivery is in Reynella, Reynella East, Woodcroft, Happy Valley, or the nearby southern corridor',
        'The move includes fuller household inventory, garage items, whitegoods, or storage-linked volume',
        'Driveway grade, split levels, access timing, or a longer follow-on route need to be priced properly',
      ],
    },
    nearbyLinks: [
      { href: '/removalists-southern-adelaide/', label: 'Southern Adelaide movers and route planning' },
      { href: '/removalists-morphett-vale/', label: 'Morphett Vale removalists' },
      { href: '/removalists-noarlunga/', label: 'Noarlunga removalists' },
      { href: '/removalists-marion/', label: 'Marion removalists' },
      { href: '/removalists-adelaide/', label: 'All Adelaide suburb coverage' },
    ],
    intro: [
      'People looking for removalists in Reynella are often not dealing with a simple short-hop move. The suburb sits in a part of the southern corridor where family homes, split-level entries, garages, and broader southbound routes combine in one brief. That changes how labour, truck positioning, and timing should be planned before the move day is locked in.',
      'Reynella is also a useful transition point between central-south Adelaide, the larger Morphett Vale and Noarlunga corridor, and interstate departures leaving from the south. Instead of treating it like a generic suburb page, we scope moves here around property access, inventory depth, and whether the route stays local, touches storage, or feeds into a longer transfer.',
    ],
    conditions: [
      'Reviewing sloped driveways, split-level layouts, and longer home-to-truck carry paths',
      'Sequencing garage items, outdoor furniture, and whitegoods with the core household load',
      'Keeping southern corridor timing realistic when the brief moves from local suburb work into a longer Adelaide or interstate leg',
    ],
    scenarios: [
      {
        title: 'Family-home and townhouse relocations',
        copy:
          'Reynella moves often involve fuller living-room, garage, and outdoor settings than a compact metro unit move. We organise the load so heavier and fragile pieces are staged deliberately instead of being repacked during the carry.',
      },
      {
        title: 'Storage-linked southbound routes',
        copy:
          'Some Reynella jobs include a storage cage, a second pickup, or a handover further south. We map the sequence early so time is not lost reshuffling inventory between stops.',
      },
      {
        title: 'Interstate departure preparation',
        copy:
          'When the Reynella address is the Adelaide leg of an interstate move, wrapping quality, loading order, and handover timing matter more. We treat the departure like a route plan, not just a suburban pickup.',
      },
    ],
    trust: [
      'ZQ Removals is chosen by Adelaide families and business owners who want the quote to reflect the real route rather than a basic room-count assumption. Our experienced movers plan access, timing, and handling before the truck is committed.',
      'That discipline matters most on southern corridor moves where broader home inventories, storage volume, or interstate follow-on legs create more moving parts. We keep the brief organised so the move stays predictable from pickup through delivery.',
    ],
    services:
      'Before booking, compare our Adelaide local removals hub, packing services, furniture movers, office removals, and interstate support so the final brief follows the right service path.',
  },
};

const suburbV4Registry = {
  'adelaide-cbd': {
    region: 'cbd',
    inventory: ['apartment towers', 'office suites', 'mixed-use inventory'],
    access: ['service lifts', 'loading docks', 'managed parking', 'short city carries'],
    intents: ['office', 'packing', 'interstate'],
    nearbyCorridors: ['North Terrace', 'King William Street', 'Grenfell Street'],
    ctaTheme: 'Book apartment move',
    supportGuide: '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
  },
  glenelg: {
    region: 'coastal',
    inventory: ['coastal apartments', 'townhouses', 'lifestyle homes'],
    access: ['beachside parking', 'shared entries', 'longer carries', 'busy frontage'],
    intents: ['furniture', 'packing', 'interstate'],
    nearbyCorridors: ['Jetty Road', 'Brighton Road', 'Anzac Highway'],
    ctaTheme: 'Plan coastal move',
    supportGuide: '/adelaide-moving-guides/coastal-moving-access-adelaide/',
  },
  marion: {
    region: 'south',
    inventory: ['family homes', 'units', 'mixed residential-commercial stock'],
    access: ['busier frontage', 'staging pressure', 'mixed site access'],
    intents: ['office', 'packing', 'furniture'],
    nearbyCorridors: ['Marion Road', 'Sturt Road', 'Diagonal Road'],
    ctaTheme: 'Get suburb-specific quote',
    supportGuide: '/adelaide-moving-guides/pricing-breakdown-adelaide/',
  },
  salisbury: {
    region: 'north',
    inventory: ['family homes', 'storage-linked loads', 'small business items'],
    access: ['driveway positioning', 'garage access', 'northern corridor traffic'],
    intents: ['furniture', 'packing', 'interstate'],
    nearbyCorridors: ['Salisbury Highway', 'Commercial Road', 'Park Terrace'],
    ctaTheme: 'Get suburb-specific quote',
    supportGuide: '/adelaide-moving-guides/storage-planning-adelaide/',
  },
  elizabeth: {
    region: 'north',
    inventory: ['family homes', 'units', 'storage transfers'],
    access: ['longer carries', 'shared access', 'northside corridor timing'],
    intents: ['furniture', 'packing', 'interstate'],
    nearbyCorridors: ['Main North Road', 'Philip Highway', 'Groth Road'],
    ctaTheme: 'Get suburb-specific quote',
    supportGuide: '/adelaide-moving-guides/how-long-moves-take-adelaide/',
  },
  reynella: {
    region: 'south',
    inventory: ['family homes', 'garage-heavy loads', 'storage-linked items'],
    access: ['split-level entries', 'driveway slope', 'southern corridor timing'],
    intents: ['furniture', 'packing', 'interstate'],
    nearbyCorridors: ['Main South Road', 'Old South Road', 'Pimpala Road'],
    ctaTheme: 'Book family-home move',
    supportGuide: '/adelaide-moving-guides/avoiding-damage-adelaide/',
  },
  noarlunga: {
    region: 'coastal',
    inventory: ['coastal homes', 'storage transitions', 'business stock'],
    access: ['parking pressure', 'coastal frontage', 'mixed-use loading'],
    intents: ['office', 'packing', 'interstate'],
    nearbyCorridors: ['Main South Road', 'Dyson Road', 'Beach Road'],
    ctaTheme: 'Plan coastal move',
    supportGuide: '/adelaide-moving-guides/storage-planning-adelaide/',
  },
  seaford: {
    region: 'coastal',
    inventory: ['coastal homes', 'family loads', 'townhouses'],
    access: ['coastal parking', 'longer carries', 'family-home staging'],
    intents: ['furniture', 'packing', 'interstate'],
    nearbyCorridors: ['Seaford Road', 'Main South Road', 'Commercial Road'],
    ctaTheme: 'Plan coastal family move',
    supportGuide: '/adelaide-moving-guides/coastal-moving-access-adelaide/',
  },
  'north-adelaide': {
    region: 'cbd',
    inventory: ['terrace homes', 'apartments', 'clinic or office inventory'],
    access: ['inner-north parking', 'tight frontage', 'apartment-style access'],
    intents: ['office', 'packing', 'interstate'],
    nearbyCorridors: ['O\'Connell Street', 'Morphett Street', 'Park Terrace'],
    ctaTheme: 'Book inner-north move',
    supportGuide: '/adelaide-moving-guides/avoiding-damage-adelaide/',
  },
  'hallett-cove': {
    region: 'coastal',
    inventory: ['family homes', 'split-level layouts', 'garage-heavy loads'],
    access: ['sloped driveways', 'stairs', 'coastal parking pressure'],
    intents: ['furniture', 'packing', 'interstate'],
    nearbyCorridors: ['Lonsdale Road', 'Main South Road', 'Ocean Boulevard'],
    ctaTheme: 'Plan split-level move',
    supportGuide: '/adelaide-moving-guides/how-long-moves-take-adelaide/',
  },
  norwood: {
    region: 'eastern',
    inventory: ['terraces', 'townhouses', 'mixed-use frontage'],
    access: ['narrow streets', 'busier parking', 'heritage-style entries'],
    intents: ['office', 'packing', 'furniture'],
    nearbyCorridors: ['The Parade', 'Magill Road', 'Portrush Road'],
    ctaTheme: 'Book eastern-corridor move',
    supportGuide: '/adelaide-moving-guides/pricing-breakdown-adelaide/',
  },
  'mawson-lakes': {
    region: 'north',
    inventory: ['apartments', 'townhouses', 'managed precinct loads'],
    access: ['lift bookings', 'shared entries', 'parking controls'],
    intents: ['office', 'packing', 'interstate'],
    nearbyCorridors: ['Main North Road', 'Garden Tce', 'University Blvd'],
    ctaTheme: 'Book apartment move',
    supportGuide: '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
  },
};

const seoGuideLibrary = {
  cost: {
    title: 'Removalists cost guide',
    url: '/adelaide-moving-guides/removalist-cost-adelaide/',
    cta: 'Read the pricing guide',
  },
  house: {
    title: 'House move preparation guide',
    url: '/adelaide-moving-guides/prepare-house-move-adelaide/',
    cta: 'Read the house-move guide',
  },
  interstate: {
    title: 'Interstate moving checklist',
    url: '/adelaide-moving-guides/interstate-moving-checklist-adelaide/',
    cta: 'Read the interstate checklist',
  },
  office: {
    title: 'Office relocation checklist',
    url: '/adelaide-moving-guides/office-relocation-checklist-adelaide/',
    cta: 'Read the office checklist',
  },
  cbdCost: {
    title: 'Adelaide CBD moving cost guide',
    url: '/adelaide-moving-guides/removalists-cost-adelaide-cbd/',
    cta: 'Read the CBD cost guide',
  },
  glenelgCost: {
    title: 'Glenelg moving cost guide',
    url: '/adelaide-moving-guides/removalists-cost-glenelg/',
    cta: 'Read the Glenelg cost guide',
  },
  marionCost: {
    title: 'Marion moving cost guide',
    url: '/adelaide-moving-guides/removalists-cost-marion/',
    cta: 'Read the Marion cost guide',
  },
  packing: {
    title: 'Packing checklist Adelaide',
    url: '/adelaide-moving-guides/packing-checklist-adelaide/',
    cta: 'Read the packing checklist',
  },
  apartments: {
    title: 'Apartment move guide Adelaide',
    url: '/adelaide-moving-guides/moving-from-apartment-buildings-adelaide/',
    cta: 'Read the apartment guide',
  },
  packingWhen: {
    title: 'When to book packing services Adelaide',
    url: '/adelaide-moving-guides/when-to-book-packing-services-adelaide/',
    cta: 'Read the packing-planning guide',
  },
  pricingBreakdown: {
    title: 'Adelaide pricing breakdown',
    url: '/adelaide-moving-guides/pricing-breakdown-adelaide/',
    cta: 'Read the pricing breakdown',
  },
  moveDuration: {
    title: 'How long moves take Adelaide',
    url: '/adelaide-moving-guides/how-long-moves-take-adelaide/',
    cta: 'Read the timing guide',
  },
  bestTime: {
    title: 'Best time to move Adelaide',
    url: '/adelaide-moving-guides/best-time-to-move-adelaide/',
    cta: 'Read the timing guide',
  },
  avoidingDamage: {
    title: 'Avoiding damage during a move',
    url: '/adelaide-moving-guides/avoiding-damage-adelaide/',
    cta: 'Read the damage-prevention guide',
  },
  storagePlanning: {
    title: 'Storage planning Adelaide',
    url: '/adelaide-moving-guides/storage-planning-adelaide/',
    cta: 'Read the storage-planning guide',
  },
  heavyFurniture: {
    title: 'Moving heavy furniture in Adelaide',
    url: '/adelaide-moving-guides/moving-heavy-furniture-adelaide/',
    cta: 'Read the furniture guide',
  },
  officeAccess: {
    title: 'Office move access planning Adelaide CBD',
    url: '/adelaide-moving-guides/office-access-planning-adelaide-cbd/',
    cta: 'Read the CBD office-access guide',
  },
  apartmentLift: {
    title: 'Apartment lift bookings Adelaide',
    url: '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
    cta: 'Read the apartment-lift guide',
  },
  coastalAccess: {
    title: 'Coastal moving access Adelaide',
    url: '/adelaide-moving-guides/coastal-moving-access-adelaide/',
    cta: 'Read the coastal-access guide',
  },
};

const faqProfiles = {
  'removalists-adelaide/index.html': {
    eyebrow: 'Adelaide removals FAQ',
    heading: 'Questions people ask before locking in a local Adelaide move.',
    intro:
      'These answers cover the scope points that usually decide whether a local Adelaide brief is ready for a final quote.',
    items: [
      {
        question: 'How do I get a fixed-price Adelaide quote that is actually usable?',
        answer:
          'Send both addresses, property types, access notes, heavier or fragile items, and whether packing or timing pressure is part of the move. The clearer the route brief, the cleaner the quote.',
      },
      {
        question: 'Can one Adelaide service page cover houses, apartments, and small office moves?',
        answer:
          'Yes. The Adelaide hub covers local residential, apartment, and lighter commercial routes, then the suburb and specialist pages go deeper where the access conditions change materially.',
      },
      {
        question: 'What usually changes a local Adelaide move after the first enquiry?',
        answer:
          'Apartment lifts, tighter parking, longer carries, storage volume, and packing scope are the most common details that change labour and timing once the route is reviewed properly.',
      },
      {
        question: 'Should I use a suburb page or the main Adelaide page?',
        answer:
          'Use the suburb page if the pickup or delivery area is already known and has specific access conditions. Use the Adelaide page when the route is still broad or spans multiple suburbs.',
      },
    ],
  },
  'interstate-removals-adelaide/index.html': {
    eyebrow: 'Interstate removals FAQ',
    heading: 'Questions people ask before approving an interstate Adelaide move.',
    intro:
      'These answers focus on the route, timing, and handover details that usually decide whether an interstate departure is ready to book.',
    items: [
      {
        question: 'What information makes an interstate Adelaide quote more accurate?',
        answer:
          'Origin and destination addresses, property types, inventory profile, access conditions at both ends, move window, fragile items, and whether packing or storage is part of the route.',
      },
      {
        question: 'Why do interstate quotes depend on both properties, not just the distance?',
        answer:
          'Because lift bookings, loading access, stair work, parking, and unload conditions at each end all affect labour planning and the delivery sequence, not just the linehaul leg.',
      },
      {
        question: 'Do interstate moves usually need a stronger packing brief?',
        answer:
          'Yes. Longer transit windows usually make protection, carton quality, wrapping, and load sequencing more important than they are on a standard local move.',
      },
      {
        question: 'When should I start planning an interstate move from Adelaide?',
        answer:
          'As early as possible, especially if the route includes apartments, settlement deadlines, storage, or narrower delivery windows that need to be aligned before departure.',
      },
    ],
  },
  'removalists-salisbury/index.html': {
    eyebrow: 'Salisbury removals FAQ',
    heading: 'Questions people ask before booking Salisbury removalists.',
    intro:
      'These answers cover the access and inventory details that most often change labour time on Salisbury moves.',
    items: [
      {
        question: 'Do you handle storage transfers and garage-heavy moves in Salisbury?',
        answer:
          'Yes. If the move includes a storage stop, garage shelving, outdoor settings, or mixed household and stock items, include that in the brief so the route and load sequencing can be quoted properly.',
      },
      {
        question: 'How do I keep a Salisbury move affordable without under-scoping the job?',
        answer:
          'The fastest win is a clearer brief: list the heavier items, call out stairs or longer carries, confirm parking position, and flag any fragile pieces. That reduces quote drift and avoids delays on move day.',
      },
      {
        question: 'What should I include in the quote request for Salisbury?',
        answer:
          'Include both suburbs, property types, preferred date window, access notes (parking, stairs, lifts, carry distance), and any bulky or fragile items so the fixed-price quote reflects the real workload.',
      },
    ],
  },
  'removalists-gawler/index.html': {
    eyebrow: 'Gawler removals FAQ',
    heading: 'Questions people ask before booking a Gawler move.',
    intro:
      'These answers focus on access, bulky furniture, and timing details that matter on Gawler routes.',
    items: [
      {
        question: 'Do you handle sofa and bed moves in Gawler?',
        answer:
          'Yes. Bulky furniture like sofas, beds, and heavier whitegoods can be scoped into the quote as long as the item list and access notes are included in the brief.',
      },
      {
        question: 'Can you help with office or stock moves in Gawler?',
        answer:
          'Yes. If the move includes desks, files, shelving, or business stock, include that in the enquiry so the delivery order and restart priorities can be planned. You can also review our office removals page for a dedicated commercial brief.',
      },
      {
        question: 'What details make a Gawler quote more accurate?',
        answer:
          'Both addresses, property types, any stairs or tight turns, parking position, heavier items, and whether packing or storage is part of the day. Those factors tend to decide labour time more than the suburb name alone.',
      },
    ],
  },
  'removalists-elizabeth-vale/index.html': {
    eyebrow: 'Elizabeth Vale removals FAQ',
    heading: 'Questions people ask before booking Elizabeth Vale removalists.',
    intro:
      'These answers cover unit access, packing decisions, and northside move planning.',
    items: [
      {
        question: 'Can you provide packing and moving services in Elizabeth Vale?',
        answer:
          'Yes. Packing can be scoped as targeted fragile-room packing or a broader room-by-room service, depending on your timeline and the inventory profile.',
      },
      {
        question: 'Do you handle units and shared-entry access in Elizabeth Vale?',
        answer:
          'Yes. Shared driveways, stair runs, and tighter parking need to be included in the access notes so the move can be planned and quoted properly before booking.',
      },
      {
        question: 'What should I include in the Elizabeth Vale quote request?',
        answer:
          'Include both suburbs, property type, stairs or lift access, parking position, heavier or fragile items, and any timing window so the fixed-price quote matches the real brief.',
      },
    ],
  },
  'removalists-elizabeth-downs/index.html': {
    eyebrow: 'Elizabeth Downs removals FAQ',
    heading: 'Questions people ask before booking an Elizabeth Downs move.',
    intro:
      'These answers focus on garage inventory, access, and cost-sensitive planning without cutting corners.',
    items: [
      {
        question: 'Do you handle garage loads and outdoor items in Elizabeth Downs?',
        answer:
          'Yes. Garage shelving, outdoor settings, and heavier items can be included in the brief so load order and handling are planned properly from the start.',
      },
      {
        question: 'Can you quote a small office relocation in the Elizabeth area?',
        answer:
          'Yes. If the move includes desks, monitors, files, shelving, or stock, include that in the enquiry so the delivery sequence supports a faster reset. The office removals page is also useful for commercial briefs.',
      },
      {
        question: 'How do you approach tight timelines on northside moves?',
        answer:
          'We start with the access notes and priority items. Short-notice availability depends on scheduling, but clear move details make it easier to confirm what is realistic and keep the plan controlled.',
      },
    ],
  },
  'removalists-blakeview/index.html': {
    eyebrow: 'Blakeview removals FAQ',
    heading: 'Questions people ask before booking a Blakeview move.',
    intro:
      'These answers cover estate access, stair runs, and mixed residential-business briefs.',
    items: [
      {
        question: 'Do you handle estate street parking and tighter access in Blakeview?',
        answer:
          'Yes. Parking position, carry distance, stairs, and tight turning points should be included in the access notes so the quote matches real conditions.',
      },
      {
        question: 'Can you support business relocation services in Blakeview?',
        answer:
          'Yes. If your brief includes office furniture, archives, shelving, or work equipment, include that in the enquiry so delivery order and restart priorities can be planned.',
      },
      {
        question: 'What makes a Blakeview quote more accurate?',
        answer:
          'Both addresses, property types, stairs, parking position, heavier items, and whether packing help is needed. The more specific the brief, the more reliable the fixed-price proposal.',
      },
    ],
  },
  'removalists-northern-adelaide/index.html': {
    eyebrow: 'Northern Adelaide removals FAQ',
    heading: 'Questions people ask before booking Adelaide north removalists.',
    intro:
      'These answers cover urgent timelines, northside access patterns, and when to use suburb pages instead.',
    items: [
      {
        question: 'Can you help with urgent moves in Adelaide’s north?',
        answer:
          'If the brief is urgent, call or send the enquiry early with access notes and larger items included. Same-day availability depends on scheduling, but clear details make it faster to confirm what is realistic.',
      },
      {
        question: 'When should I use a suburb page instead of the northside hub?',
        answer:
          'Use the suburb page when the pickup or delivery suburb is known and has specific access constraints. Use the northside hub when the route spans multiple northern suburbs or you are still comparing areas.',
      },
      {
        question: 'Do you handle office furniture moves in Adelaide’s north?',
        answer:
          'Yes. Desks, monitors, files, and office equipment can be planned as part of the move brief. For a dedicated commercial scope, use the office removals page as well.',
      },
    ],
  },
  'removalists-morphett-vale/index.html': {
    eyebrow: 'Morphett Vale removals FAQ',
    heading: 'Questions people ask before booking a Morphett Vale move.',
    intro:
      'These answers focus on larger family-home loads, garage inventory, and southern corridor planning before the quote is approved.',
    items: [
      {
        question: 'Do you handle garage stock and outdoor furniture in Morphett Vale?',
        answer:
          'Yes. Garage shelving, outdoor settings, whitegoods, and bulkier household items can all be included in the move brief so loading order and labour are planned properly.',
      },
      {
        question: 'Can a Morphett Vale move also be quoted for interstate relocation?',
        answer:
          'Yes. If the Morphett Vale pickup becomes the Adelaide leg of an interstate route, the same brief can include packing, access, and handover details before the interstate booking is confirmed.',
      },
      {
        question: 'What makes a Morphett Vale quote more accurate?',
        answer:
          'Both addresses, property types, driveway access, stairs, carry distance, heavier items, and any packing or storage requirements. Those factors usually decide labour time more than the suburb name alone.',
      },
    ],
  },
  'removalists-reynella/index.html': {
    eyebrow: 'Reynella removals FAQ',
    heading: 'Questions people ask before booking a Reynella move.',
    intro:
      'These answers focus on family-home inventory, driveway and split-level access, storage-linked loads, and when the route becomes a longer southern or interstate brief.',
    items: [
      {
        question: 'Do you handle garage stock and larger family-home loads in Reynella?',
        answer:
          'Yes. Garage shelving, outdoor settings, whitegoods, and fuller household furniture can all be included in the brief so labour and truck setup are planned properly from the start.',
      },
      {
        question: 'Can a Reynella move also be scoped for interstate relocation?',
        answer:
          'Yes. If Reynella is the Adelaide pickup leg of an interstate route, the quote can include packing, access, and handover detail before the longer route is confirmed.',
      },
      {
        question: 'What usually changes the quote on a Reynella move?',
        answer:
          'Driveway slope, split levels, storage-linked items, heavier furniture, and whether the route stays local or continues further south are the details that usually change timing and labour.',
      },
    ],
  },
  'removalists-noarlunga/index.html': {
    eyebrow: 'Noarlunga removals FAQ',
    heading: 'Questions people ask before booking Noarlunga removalists.',
    intro:
      'These answers cover coastal access, storage-linked jobs, and mixed residential-business moves in the southern corridor.',
    items: [
      {
        question: 'Do you handle Noarlunga moves with storage or mixed inventory?',
        answer:
          'Yes. Storage boxes, stock, archived items, and household furniture can all be scoped in one move brief so the sequence stays organised from pickup to delivery.',
      },
      {
        question: 'Can Noarlunga jobs include business or office equipment?',
        answer:
          'Yes. If the move includes desks, monitors, files, shelving, or business stock, include that in the enquiry so the load order and restart priorities can be planned properly.',
      },
      {
        question: 'Why do Noarlunga and nearby coastal routes still need detailed access notes?',
        answer:
          'Parking limits, unit access, stairs, longer carries, and southern corridor timing can all change labour and delivery sequencing, even when the move looks simple on paper.',
      },
    ],
  },
};

const seoSupportProfiles = {
  'removalists-adelaide/index.html': {
    eyebrow: 'Adelaide planning guides',
    heading: 'Start with the guide that matches the Adelaide move brief.',
    intro:
      'Local Adelaide jobs usually branch into pricing questions, house-move preparation, commercial planning, or interstate scope. Use the guide that closes the biggest planning gap before the quote is finalised.',
    cards: [
      {
        guide: 'cost',
        description:
          'Review the pricing guide before comparing Adelaide quotes so access, inventory, and packing scope are framed consistently.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the brief covers a home, apartment, townhouse, or family move that needs room-by-room preparation.',
      },
      {
        guide: 'office',
        description:
          'Use the office checklist if the move involves suites, clinics, workstations, or a staged business reset.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the Adelaide move is the first leg of a longer route out of South Australia.',
      },
    ],
    supportLinks: [
      { url: '/adelaide-moving-guides/', label: 'See all Adelaide moving guides' },
      { url: '/contact-us/#quote-form', label: 'Request a fixed-price Adelaide quote' },
    ],
  },
  'furniture-removalists-adelaide/index.html': {
    eyebrow: 'Furniture move planning guides',
    heading: 'Use the guide that protects the furniture brief before move day.',
    intro:
      'Furniture-heavy jobs usually need tighter pricing, packing, and route planning than a generic local move. These guides cover the issues that most often change handling standards and labour time.',
    cards: [
      {
        guide: 'cost',
        description:
          'Read the pricing guide before comparing furniture-move quotes so protection, access, and carry distance are scoped properly.',
      },
      {
        guide: 'packing',
        description:
          'Use the packing checklist when the brief includes fragile pieces, wrapped furniture, or a staged pre-move protection plan.',
      },
      {
        guide: 'heavyFurniture',
        description:
          'Use the heavy-furniture guide for stairs, turning points, delicate finishes, and the access details that most often change the handling plan.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if fragile or oversized furniture is leaving Adelaide on a longer route.',
      },
    ],
    supportLinks: [
      { url: '/packing-services-adelaide/', label: 'Add packing support for fragile furniture' },
      { url: '/adelaide-moving-guides/', label: 'Browse the full guide hub' },
    ],
  },
  'office-removals-adelaide/index.html': {
    eyebrow: 'Office planning guides',
    heading: 'Use the office guide set before the relocation window is locked in.',
    intro:
      'Commercial moves usually depend on downtime planning, building access, IT sequencing, and how accurately the first quote reflects the restart priority. These guides close those gaps before the move date is confirmed.',
    cards: [
      {
        guide: 'office',
        description:
          'Start with the office checklist for access windows, staff comms, IT sequencing, and restart priorities.',
      },
      {
        guide: 'officeAccess',
        description:
          'Use the CBD office-access guide when loading docks, service lifts, concierge approvals, or after-hours windows are the main risk in the brief.',
      },
      {
        guide: 'cost',
        description:
          'Use the pricing guide to compare commercial quotes against dock access, labour assumptions, and staging complexity.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the office brief includes interstate assets, archive transfer, or a multi-city reset.',
      },
    ],
    supportLinks: [
      { url: '/packing-services-adelaide/', label: 'Pair the move with packing and crate support' },
      { url: '/adelaide-moving-guides/', label: 'See every Adelaide planning guide' },
    ],
  },
  'packing-services-adelaide/index.html': {
    eyebrow: 'Packing planning guides',
    heading: 'Use the guide that matches the packing brief before materials are booked.',
    intro:
      'Packing work usually changes because of fragile inventory, time pressure, and whether the cartons are staying local or heading interstate. These guides help scope those issues before the packing crew is scheduled.',
    cards: [
      {
        guide: 'packing',
        description:
          'Start with the packing checklist to organise materials, labeling, fragile-item prep, and what should be packed first.',
      },
      {
        guide: 'packingWhen',
        description:
          'Use the packing-planning guide to decide when the move needs professional packing rather than a full self-pack approach.',
      },
      {
        guide: 'cost',
        description:
          'Use the pricing guide to understand how materials, fragility, labour, and unpack scope change the final quote.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the packing brief has to support a longer route, tighter delivery window, or storage handover.',
      },
    ],
    supportLinks: [
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
      { url: '/adelaide-moving-guides/', label: 'Open the full guide hub' },
    ],
  },
  'interstate-removals-adelaide/index.html': {
    eyebrow: 'Interstate planning guides',
    heading: 'Use the guide set that removes guesswork from interstate departures.',
    intro:
      'Interstate jobs depend on timing, inventory accuracy, delivery windows, and how well the Adelaide pickup is prepared before the truck leaves South Australia. These guides tighten the brief before the fixed-price quote is confirmed.',
    cards: [
      {
        guide: 'interstate',
        description:
          'Start with the interstate checklist for inventory, booking windows, delivery sequencing, and arrival-day expectations.',
      },
      {
        guide: 'packingWhen',
        description:
          'Use the packing-planning guide when the interstate route includes fragile rooms, tighter timing, or an Adelaide departure that should be packed professionally.',
      },
      {
        guide: 'cost',
        description:
          'Use the pricing guide to compare route-based interstate quotes against access, packing, and linehaul variables.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the interstate brief still needs decluttering, fragile prep, and handover planning at the Adelaide end.',
      },
    ],
    supportLinks: [
      { url: '/adelaide-to-melbourne-removals/', label: 'See Adelaide to Melbourne removals' },
      { url: '/adelaide-to-sydney-removals/', label: 'See Adelaide to Sydney removals' },
      { url: '/adelaide-moving-guides/', label: 'Browse every planning guide' },
    ],
  },
  'adelaide-to-melbourne-removals/index.html': {
    eyebrow: 'Melbourne route planning',
    heading: 'Use the route guides before an Adelaide to Melbourne departure is priced.',
    intro:
      'Adelaide to Melbourne jobs move faster when the inventory, pickup access, and destination timing are defined before the route is locked in. These guides cover the planning points that most often change the final interstate brief.',
    cards: [
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist for booking windows, inventory control, and arrival-day planning on the Melbourne route.',
      },
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Melbourne quotes so linehaul, access, and packing assumptions stay consistent.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the Adelaide pickup still needs decluttering, fragile prep, or room-by-room staging.',
      },
    ],
    supportLinks: [
      { url: '/interstate-removals-adelaide/', label: 'Return to the interstate removals hub' },
      { url: '/packing-services-adelaide/', label: 'Add interstate packing support' },
    ],
  },
  'adelaide-to-sydney-removals/index.html': {
    eyebrow: 'Sydney route planning',
    heading: 'Use the route guides before an Adelaide to Sydney departure is priced.',
    intro:
      'Adelaide to Sydney jobs usually hinge on a clean departure brief, stronger packing control, and a realistic delivery window. These guides handle the planning work that often gets missed before the route is booked.',
    cards: [
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist for booking windows, inventory control, and arrival-day planning on the Sydney route.',
      },
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Sydney quotes so linehaul, access, and protection scope are measured consistently.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the Adelaide pickup still needs decluttering, fragile prep, or handover planning before departure.',
      },
    ],
    supportLinks: [
      { url: '/interstate-removals-adelaide/', label: 'Return to the interstate removals hub' },
      { url: '/packing-services-adelaide/', label: 'Add interstate packing support' },
    ],
  },
  'removalists-adelaide-cbd/index.html': {
    eyebrow: 'Adelaide CBD planning guides',
    heading: 'Use the guide that matches the CBD access brief before pricing is locked in.',
    intro:
      'City moves usually hinge on dock bookings, lift windows, permit timing, and whether the brief is residential, commercial, or mixed-use. These guides make the CBD scope easier to define before the quote is final.',
    cards: [
      {
        guide: 'cbdCost',
        description:
          'Use the CBD cost guide before comparing city quotes so dock access, lift timing, and loading distance are framed properly.',
      },
      {
        guide: 'office',
        description:
          'Use the office checklist if the CBD move involves suites, clinics, desks, archives, or a staged commercial reset.',
      },
      {
        guide: 'officeAccess',
        description:
          'Use the office-access guide when the real issue is dock windows, service lifts, loading permits, and how to keep the building rules from derailing the move.',
      },
      {
        guide: 'apartments',
        description:
          'Use the apartment guide if the CBD brief is tower-led and still needs lift planning, loading windows, or corridor protection.',
      },
    ],
    supportLinks: [
      { url: '/office-removals-adelaide/', label: 'Pair it with the office removals page' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-southern-adelaide/index.html': {
    eyebrow: 'Southern corridor planning guides',
    heading: 'Use the guide set that fits the south-side move brief.',
    intro:
      'Southern Adelaide jobs usually branch into packing, heavier furniture handling, or interstate planning once the suburb route is known. These guides support that planning before the quote is fixed.',
    cards: [
      {
        guide: 'coastalAccess',
        description:
          'Use the coastal-access guide when parking pressure, shared beachside entries, stairs, or sea-facing apartment access are likely to shape the move.',
      },
      {
        guide: 'heavyFurniture',
        description:
          'Use the furniture guide when the brief includes heavier pieces, garage inventory, stair work, or delicate handling across southern suburbs.',
      },
      {
        guide: 'packingWhen',
        description:
          'Use the packing-planning guide when the move includes fragile rooms, storage, or timing pressure that makes self-packing risky.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist when the southern Adelaide pickup becomes the first leg of a route out of South Australia.',
      },
    ],
    supportLinks: [
      { url: '/removalists-morphett-vale/', label: 'See Morphett Vale removalists' },
      { url: '/removalists-reynella/', label: 'See Reynella removalists' },
      { url: '/removalists-noarlunga/', label: 'See Noarlunga removalists' },
      { url: '/adelaide-moving-guides/', label: 'Browse every Adelaide planning guide' },
    ],
  },
  'removalists-northern-adelaide/index.html': {
    eyebrow: 'Northern corridor planning guides',
    heading: 'Use the guide set that matches northside move conditions.',
    intro:
      'Northern Adelaide jobs often expand into family-home preparation, heavier furniture handling, or office-related sequencing once the route and inventory are clearer. These guides support that work before move day is booked.',
    cards: [
      {
        guide: 'apartmentLift',
        description:
          'Use the apartment-lift guide when Mawson Lakes apartments, mixed-use buildings, or booked vertical access make the move more operationally tight.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide when the northside brief includes family-home staging, garage items, or room-by-room preparation before the truck arrives.',
      },
      {
        guide: 'heavyFurniture',
        description:
          'Use the furniture guide for bulkier pieces, tight turns, stairs, or access-sensitive handling across the northern corridor.',
      },
      {
        guide: 'office',
        description:
          'Use the office checklist if the northside route includes desks, files, shelving, or a lighter commercial reset alongside the main move.',
      },
    ],
    supportLinks: [
      { url: '/removalists-salisbury/', label: 'See Salisbury removalists' },
      { url: '/removalists-mawson-lakes/', label: 'See Mawson Lakes removalists' },
      { url: '/removalists-gawler/', label: 'See Gawler removalists' },
      { url: '/adelaide-moving-guides/', label: 'Browse every Adelaide planning guide' },
    ],
  },
  'removalists-morphett-vale/index.html': {
    eyebrow: 'Morphett Vale planning guides',
    heading: 'Use the guide set that matches larger southern family moves.',
    intro:
      'Morphett Vale jobs usually need clearer prep around garage items, heavier furniture, and whether the route stays local or extends further south or interstate. These guides help close those gaps before the quote is finalised.',
    cards: [
      {
        guide: 'house',
        description:
          'Use the house-move guide when the brief includes larger family-home preparation, decluttering, and room-by-room staging before move day.',
      },
      {
        guide: 'heavyFurniture',
        description:
          'Use the furniture guide when whitegoods, outdoor settings, and heavier pieces need a more deliberate handling plan.',
      },
      {
        guide: 'packingWhen',
        description:
          'Use the packing-planning guide when the move includes fragile rooms, tighter timing, or an interstate leg that makes professional packing more worthwhile.',
      },
    ],
    supportLinks: [
      { url: '/removalists-southern-adelaide/', label: 'Return to the Southern Adelaide hub' },
      { url: '/interstate-removals-adelaide/', label: 'See interstate removals Adelaide' },
    ],
  },
  'removalists-noarlunga/index.html': {
    eyebrow: 'Noarlunga planning guides',
    heading: 'Use the guide set that fits coastal and mixed-load southern moves.',
    intro:
      'Noarlunga jobs often branch into coastal access, storage sequencing, packing, and business-equipment handling. These guides support those decisions before the move is priced as final.',
    cards: [
      {
        guide: 'packingWhen',
        description:
          'Use the packing-planning guide when the brief includes fragile rooms, storage, or a route that needs cleaner pre-move organisation.',
      },
      {
        guide: 'officeAccess',
        description:
          'Use the office-access guide when the Noarlunga move includes business stock, workstations, or access windows that need a commercial planning lens.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist when the southern coastal pickup becomes part of a longer route outside Adelaide.',
      },
    ],
    supportLinks: [
      { url: '/removalists-southern-adelaide/', label: 'Return to the Southern Adelaide hub' },
      { url: '/packing-services-adelaide/', label: 'Add packing services Adelaide' },
    ],
  },
  'removalists-andrews-farm/index.html': {
    eyebrow: 'Andrews Farm planning guides',
    heading: 'Use the right guide before the Andrews Farm quote is confirmed.',
    intro:
      'Andrews Farm moves usually depend on driveway access, garage storage, family-home inventory, and whether the northern suburb pickup becomes a longer departure. These guides tighten the brief before pricing is locked in.',
    cards: [
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Andrews Farm quotes so driveway access, inventory volume, and labour time are scoped cleanly.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the Andrews Farm brief covers a family home that still needs decluttering, labeling, and fragile prep.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the northern suburb pickup is the first leg of a move leaving Adelaide.',
      },
    ],
    supportLinks: [
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
      { url: '/packing-services-adelaide/', label: 'Add packing support for larger family inventories' },
    ],
  },
  'removalists-elizabeth/index.html': {
    eyebrow: 'Elizabeth planning guides',
    heading: 'Use the right guide before the Elizabeth brief becomes a final quote.',
    intro:
      'Elizabeth jobs often combine family-home inventory, storage links, and northern access planning with the possibility of longer departures. These guides cover the planning gaps that usually affect timing and price.',
    cards: [
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Elizabeth quotes so inventory, access, and storage touchpoints are measured consistently.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the Elizabeth move still needs decluttering, room sequencing, or fragile-item prep before move day.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the Elizabeth pickup is feeding a longer route outside Adelaide.',
      },
    ],
    supportLinks: [
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
      { url: '/packing-services-adelaide/', label: 'Add packing support for storage or fragile items' },
    ],
  },
  'removalists-glenelg/index.html': {
    eyebrow: 'Glenelg planning guides',
    heading: 'Use the right guide before the Glenelg quote is locked in.',
    intro:
      'Glenelg moves usually turn on beachside parking, apartment access, and whether the coastal pickup stays local or becomes a longer departure. These guides make those planning issues easier to define before pricing is confirmed.',
    cards: [
      {
        guide: 'glenelgCost',
        description:
          'Use the Glenelg cost guide before comparing beachside quotes so parking pressure, carry distance, and access timing are framed properly.',
      },
      {
        guide: 'apartments',
        description:
          'Use the apartment guide if the Glenelg brief covers shared entries, lifts, or tighter coastal apartment layouts.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the Glenelg pickup is part of a longer route leaving Adelaide.',
      },
    ],
    supportLinks: [
      { url: '/packing-services-adelaide/', label: 'Add packing support for coastal apartments and fragile items' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-hallett-cove/index.html': {
    eyebrow: 'Hallett Cove planning guides',
    heading: 'Use the right guide before the Hallett Cove move date is fixed.',
    intro:
      'Hallett Cove moves usually depend on sloped driveways, split-level homes, and whether the far-south route stays local or becomes a longer departure. These guides tighten the plan before the fixed-price quote is locked in.',
    cards: [
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Hallett Cove quotes so driveway access, stair work, and carry distance are framed properly.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the brief covers a family home that still needs decluttering, labeling, and room-by-room preparation.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the southern pickup is part of a move leaving Adelaide.',
      },
    ],
    supportLinks: [
      { url: '/packing-services-adelaide/', label: 'Add packing support for split-level homes and fragile items' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-marion/index.html': {
    eyebrow: 'Marion planning guides',
    heading: 'Use the guide that matches the Marion brief before pricing is final.',
    intro:
      'Marion jobs often blend units, family homes, clinics, offices, and busier south-west access conditions. These guides help define whether the move is primarily residential, commercial, or a mix of both before the quote is finalised.',
    cards: [
      {
        guide: 'marionCost',
        description:
          'Use the Marion cost guide before comparing south-west quotes so access, inventory mix, and staging time are measured consistently.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the Marion job is still primarily residential and needs a cleaner packing and room-order brief.',
      },
      {
        guide: 'office',
        description:
          'Use the office checklist if the Marion move includes clinics, workstations, stock, or a mixed-use business component.',
      },
    ],
    supportLinks: [
      { url: '/office-removals-adelaide/', label: 'Pair it with the office removals page' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-mawson-lakes/index.html': {
    eyebrow: 'Mawson Lakes planning guides',
    heading: 'Use the right guide before the Mawson Lakes quote is confirmed.',
    intro:
      'Mawson Lakes moves often involve apartment access, managed precinct parking, townhouses, and mixed residential-commercial layouts. These guides help define the access and inventory brief before the quote is locked in.',
    cards: [
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Mawson Lakes quotes so managed access, parking, and labour assumptions are aligned.',
      },
      {
        guide: 'apartments',
        description:
          'Use the apartment guide if the Mawson Lakes brief covers managed entries, apartment parking, or townhouse access.',
      },
      {
        guide: 'office',
        description:
          'Use the office checklist if the move touches a workspace, clinic, or mixed-use tenancy inside the precinct.',
      },
    ],
    supportLinks: [
      { url: '/office-removals-adelaide/', label: 'Pair it with the office removals page' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-north-adelaide/index.html': {
    eyebrow: 'North Adelaide planning guides',
    heading: 'Use the right guide before the North Adelaide move is priced.',
    intro:
      'North Adelaide moves usually depend on terrace access, apartment parking, clinic or office loading, and tighter inner-north timing. These guides help define those constraints before the quote is final.',
    cards: [
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing North Adelaide quotes so terrace access, parking, and handling time are measured consistently.',
      },
      {
        guide: 'apartments',
        description:
          'Use the apartment guide if the North Adelaide brief covers terraces, apartments, or tighter inner-north access conditions.',
      },
      {
        guide: 'office',
        description:
          'Use the office checklist if the inner-north move includes clinics, consulting suites, or workstations.',
      },
    ],
    supportLinks: [
      { url: '/office-removals-adelaide/', label: 'Pair it with the office removals page' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-norwood/index.html': {
    eyebrow: 'Norwood planning guides',
    heading: 'Use the right guide before the Norwood quote is locked in.',
    intro:
      'Norwood jobs often combine character homes, townhouses, tighter parking, and mixed-use frontage near busier eastern corridors. These guides make the route and inventory brief easier to define before pricing is confirmed.',
    cards: [
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Norwood quotes so parking, carry distance, and handling time are framed properly.',
      },
      {
        guide: 'apartments',
        description:
          'Use the apartment guide if the Norwood brief covers tighter parking, units, or mixed-use frontage that changes access.',
      },
      {
        guide: 'office',
        description:
          'Use the office checklist if the route includes a studio, clinic, or mixed-use business component.',
      },
    ],
    supportLinks: [
      { url: '/office-removals-adelaide/', label: 'Pair it with the office removals page' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-salisbury/index.html': {
    eyebrow: 'Salisbury planning guides',
    heading: 'Use the right guide before the Salisbury quote is finalised.',
    intro:
      'Salisbury jobs often combine family homes, storage links, and northern corridor logistics with the possibility of longer departures. These guides close the planning gaps that usually affect labour and timing.',
    cards: [
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Salisbury quotes so inventory, access, and storage assumptions are measured cleanly.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the Salisbury brief still needs decluttering, fragile prep, and room-by-room planning.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the northern pickup is part of a route leaving Adelaide.',
      },
    ],
    supportLinks: [
      { url: '/packing-services-adelaide/', label: 'Add packing support for larger family or storage moves' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-seaford/index.html': {
    eyebrow: 'Seaford planning guides',
    heading: 'Use the right guide before the Seaford route is locked in.',
    intro:
      'Seaford moves usually depend on coastal family-home access, southern travel time, and whether the brief stays local or becomes a longer departure. These guides tighten the plan before the quote is confirmed.',
    cards: [
      {
        guide: 'coastalAccess',
        description:
          'Use the coastal-access guide when parking, frontage, stairs, and longer carries are the main Seaford variables. ',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the Seaford brief covers a family home that still needs labeling, decluttering, and fragile prep.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the far-south pickup is part of a route leaving Adelaide.',
      },
    ],
    supportLinks: [
      { url: '/packing-services-adelaide/', label: 'Add packing support for coastal family moves' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
  'removalists-southern-adelaide/index.html': {
    eyebrow: 'Southern Adelaide planning guides',
    heading: 'Use the right guide before the southern route is priced.',
    intro:
      'Southern Adelaide moves often span coastal suburbs, family homes, business premises, and longer southbound timing windows. These guides make the route and inventory brief easier to define before the fixed-price quote is locked in.',
    cards: [
      {
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Southern Adelaide quotes so route length, access, and labour assumptions are measured consistently.',
      },
      {
        guide: 'coastalAccess',
        description:
          'Use the coastal-access guide when the route touches Glenelg, Seaford, Noarlunga, or another suburb where parking, frontage, and shared entries shape labour time.',
      },
      {
        guide: 'house',
        description:
          'Use the house-move guide if the southern brief still needs decluttering, packing order, and room-by-room preparation.',
      },
      {
        guide: 'interstate',
        description:
          'Use the interstate checklist if the southern route is feeding a longer departure outside Adelaide.',
      },
    ],
    supportLinks: [
      { url: '/packing-services-adelaide/', label: 'Add packing support for longer southern routes' },
      { url: '/removalists-reynella/', label: 'Use Reynella for family-home and southern junction routes' },
      { url: '/removalists-adelaide/', label: 'Return to the Adelaide removals hub' },
    ],
  },
};

const localProofProfiles = {
  'removalists-adelaide-cbd/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that this page is built around real Adelaide CBD move conditions.',
    intro:
      'The trust signal on a city move is operational specificity. These are the details that usually show up when the route is actually in the CBD.',
    cards: [
      {
        title: 'Tower access is normal, not edge-case',
        copy: 'CBD moves often live inside booked lifts, dock windows, and concierge-controlled shared areas.',
        points: ['Service-lift timing affects load order', 'Dock access can define the whole move window', 'Shared-area protection is often mandatory'],
      },
      {
        title: 'Mixed residential and office inventory is common',
        copy: 'The city core often blends apartment furniture, archives, desks, and shared-space equipment inside one brief.',
        points: ['Apartment towers and office suites share access pressure', 'Workstation gear needs a different reset sequence', 'Mixed-use loads usually need tighter staging'],
      },
      {
        title: 'City timing matters more than raw distance',
        copy: 'Short routes still become access-sensitive when parking and loading are controlled by the building and the street.',
        points: ['Loading zones can limit truck placement', 'After-hours windows may be the only viable option', 'Carry distance often matters more than suburb-to-suburb mileage'],
      },
    ],
  },
  'removalists-andrews-farm/index.html': {
    eyebrow: 'Local proof',
    heading: 'Route signals that usually show up on Andrews Farm moves.',
    intro:
      'This area tends to behave like a family-home and garage-stock brief, not a generic metro transfer.',
    cards: [
      {
        title: 'Driveway and frontage access matter',
        copy: 'Northern-family-home routes are usually defined by how cleanly the truck can work from the driveway or verge.',
        points: ['Longer driveways change carry time', 'Trailer or garage storage can increase volume', 'Street positioning still matters on busier stretches'],
      },
      {
        title: 'Garage and shed inventory is often part of the scope',
        copy: 'Andrews Farm jobs often include shelving, outdoor items, spare fridges, and overflow stock beyond the main house.',
        points: ['Garage stock changes labour time', 'Bulky items need clearer load order', 'Packing support helps when inventory is wider than expected'],
      },
      {
        title: 'Northern departures can become longer routes',
        copy: 'Family-home pickups in the north regularly connect into storage, outer-metro, or interstate departures.',
        points: ['Route planning matters before pricing is fixed', 'Storage touchpoints can expand the brief', 'Interstate readiness is often decided early'],
      },
    ],
  },
  'removalists-elizabeth/index.html': {
    eyebrow: 'Local proof',
    heading: 'Why Elizabeth routes need more than a basic suburb label.',
    intro:
      'Elizabeth work often combines family-home volume, storage links, and northern corridor timing rather than a simple single-property move.',
    cards: [
      {
        title: 'Family-home inventory is usually the real driver',
        copy: 'Elizabeth jobs often involve fuller house loads, whitegoods, outdoor items, and storage overflow.',
        points: ['Garage and shed stock is common', 'Heavier household items affect staging', 'Inventory depth matters more than room count alone'],
      },
      {
        title: 'Storage and secondary stops are common',
        copy: 'The route often includes storage units, family properties, or interim holding points that change the sequence.',
        points: ['Multiple stopovers alter labour planning', 'Better inventory control reduces quote drift', 'Packing scope often grows once storage is included'],
      },
      {
        title: 'Northern corridor timing still matters',
        copy: 'Even local Elizabeth routes behave differently once travel windows and access notes are defined clearly.',
        points: ['Travel between clusters affects timing', 'Longer driveways and wider frontages change truck setup', 'Interstate departures can start from the same brief'],
      },
    ],
  },
  'removalists-glenelg/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up on real Glenelg move briefs.',
    intro:
      'Beachside trust comes from describing the access pressure correctly, not from broad metro language.',
    cards: [
      {
        title: 'Parking pressure is part of the move plan',
        copy: 'Truck placement, beachside traffic, and tighter frontage conditions often decide the carry path before the job starts.',
        points: ['Street position changes labour time', 'Short routes can still be slow to stage', 'Busy periods affect access quality'],
      },
      {
        title: 'Shared-entry apartments are common',
        copy: 'Glenelg moves regularly involve apartments, lifts, stairs, and tighter corridor turns close to the coast.',
        points: ['Shared-area protection can be required', 'Stair and lift details affect the quote', 'Room placement matters in tighter layouts'],
      },
      {
        title: 'Fragile coastal furniture needs better preparation',
        copy: 'Glass tables, artwork, and awkward lounges are common on coastal apartment and townhouse briefs.',
        points: ['Wrapping scope changes the labour plan', 'Packing support reduces damage risk', 'Higher-value furniture slows careless crews quickly'],
      },
    ],
  },
  'removalists-hallett-cove/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up on Hallett Cove routes.',
    intro:
      'This area often behaves like a split-level, sloped-access move rather than a flat suburban pickup.',
    cards: [
      {
        title: 'Sloped driveways and split levels are common',
        copy: 'Hallett Cove jobs often involve stepped access paths and multi-level homes that change the carry sequence.',
        points: ['Stair work affects labour time', 'Driveway grade changes truck setup', 'Placement order matters more on split-level layouts'],
      },
      {
        title: 'Family-home furniture mixes with awkward items',
        copy: 'Longer homes, bigger lounges, whitegoods, and outdoor pieces often create a wider handling brief.',
        points: ['Garage and patio items expand scope', 'Heavier furniture slows tighter access points', 'Packing support helps on fragile loads'],
      },
      {
        title: 'Southern travel time still shapes the day',
        copy: 'The route can stay local, but access and distance across the south still influence timing once the brief is real.',
        points: ['Far-south timing is not the same as inner-metro timing', 'Coastal plus hillside access changes planning', 'Interstate departures often start from southern pickups'],
      },
    ],
  },
  'removalists-marion/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up on Marion move briefs.',
    intro:
      'Marion trust comes from acknowledging the mixed residential and commercial conditions in the corridor, not from pretending every route is the same.',
    cards: [
      {
        title: 'The suburb mixes homes, units, and business stock',
        copy: 'Marion work often sits between a home move and an operational mixed-use brief.',
        points: ['Clinics and offices appear in the same corridor', 'Units and family homes require different staging', 'Inventory mix matters more than postcode alone'],
      },
      {
        title: 'Access can change block by block',
        copy: 'Parking, internal corridors, settlement timing, and shared access all show up across the south-west route.',
        points: ['Unit access alters labour assumptions', 'Commercial frontages need clearer timing', 'Tighter staging prevents move-day drift'],
      },
      {
        title: 'The route often needs both residential and office logic',
        copy: 'Marion jobs regularly need a cleaner decision on whether the move is really home-led, business-led, or mixed.',
        points: ['Workstations change unload order', 'Fragile household pieces still need protection', 'Packing scope often expands once inventory is itemised'],
      },
    ],
  },
  'removalists-mawson-lakes/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up on Mawson Lakes routes.',
    intro:
      'This precinct often behaves like a managed-access move with apartments, townhouses, and mixed-use frontage.',
    cards: [
      {
        title: 'Managed parking and apartment access are common',
        copy: 'Truck placement, internal courtyards, and apartment entries often shape the carry path before the move starts.',
        points: ['Parking rules can tighten the load window', 'Townhouse and apartment layouts differ sharply', 'Shared entries need cleaner staging'],
      },
      {
        title: 'Precinct moves can mix home and workspace inventory',
        copy: 'Mawson Lakes jobs regularly include study setups, small-office stock, or mixed-use tenancies.',
        points: ['Desk gear changes packing priorities', 'Monitor and electronics protection matters', 'Mixed-use loads need clearer sequencing'],
      },
      {
        title: 'The route is more controlled than a broad suburban move',
        copy: 'Precinct-style access rewards better labels, better protection, and cleaner truck setup.',
        points: ['Apartment guide logic often applies', 'Packing quality is more visible in tighter entries', 'Under-scoped quotes show up quickly onsite'],
      },
    ],
  },
  'removalists-north-adelaide/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up on North Adelaide routes.',
    intro:
      'North Adelaide trust comes from acknowledging terraces, clinics, inner-north parking, and tighter access conditions.',
    cards: [
      {
        title: 'Terraces and apartments change the carry path',
        copy: 'Older layouts, stair runs, and tighter frontage often matter more than the room count suggests.',
        points: ['Terrace entries are rarely simple', 'Apartment parking can be restrictive', 'Older buildings usually need cleaner placement'],
      },
      {
        title: 'Clinic and consulting-suite moves are common',
        copy: 'North Adelaide often blends residential routes with practice, consulting, and lighter commercial inventory.',
        points: ['Shared equipment needs protection', 'Business downtime changes timing', 'Mixed-use access affects the quote'],
      },
      {
        title: 'Inner-north parking pressure affects timing',
        copy: 'Short metro distances still become access-sensitive when the truck cannot stage cleanly near the property.',
        points: ['Parking defines carry distance', 'After-hours windows can improve access', 'Packing support reduces friction in tighter entries'],
      },
    ],
  },
  'removalists-norwood/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up on Norwood routes.',
    intro:
      'Norwood moves usually sit inside tighter eastern-corridor access and mixed frontage conditions rather than broad suburban loading.',
    cards: [
      {
        title: 'Character homes and units need different staging',
        copy: 'Norwood often mixes older homes, townhouses, and apartment-style entries inside the same route cluster.',
        points: ['Layout age affects handling', 'Tighter frontage changes truck setup', 'Fragile furniture is common on character-home moves'],
      },
      {
        title: 'Main-road and mixed frontage access is common',
        copy: 'Shops, studios, and mixed-use frontages can introduce busier loading conditions than a quiet suburban street.',
        points: ['Parking windows matter more', 'Shared frontage affects carry distance', 'Move timing can influence the final plan'],
      },
      {
        title: 'The suburb often needs apartment-style planning',
        copy: 'Norwood routes frequently reward better labels, better wrapping, and a more controlled unload order.',
        points: ['Apartment guide logic often applies', 'Packing detail matters on tighter routes', 'Quote accuracy improves when access is described precisely'],
      },
    ],
  },
  'removalists-salisbury/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up on Salisbury routes.',
    intro:
      'Salisbury jobs often look simple from the postcode but usually depend on inventory depth, storage links, and northern corridor timing.',
    cards: [
      {
        title: 'Family-home and storage volume is common',
        copy: 'Salisbury routes often include fuller household loads, garages, and secondary storage items.',
        points: ['Garage stock adds labour time', 'Larger whitegoods change staging', 'Inventory depth matters early'],
      },
      {
        title: 'Small-business crossover is not unusual',
        copy: 'The corridor can mix residential work with lighter commercial or mixed-use inventory.',
        points: ['Shelving and stock need clearer handling', 'Workstation gear changes unload priority', 'Mixed-use jobs should not be priced like simple house moves'],
      },
      {
        title: 'Northern travel still shapes the brief',
        copy: 'Even local Salisbury jobs behave differently once the route, access, and timing are reviewed properly.',
        points: ['Travel between northern clusters affects timing', 'Longer frontages change truck placement', 'Interstate planning can start from the same brief'],
      },
    ],
  },
  'removalists-seaford/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up on Seaford routes.',
    intro:
      'Seaford trust comes from treating the route as a southern coastal brief, not a generic Adelaide job.',
    cards: [
      {
        title: 'Family-home inventory is usually broader',
        copy: 'Seaford moves often involve full-home furniture, outdoor items, and garage stock rather than a tighter metro apartment load.',
        points: ['Outdoor and storage items add scope', 'Whitegoods and heavier furniture matter early', 'Packing support helps when the inventory is wider than expected'],
      },
      {
        title: 'Southern travel time still affects the day',
        copy: 'The move may stay local, but longer southbound travel and access windows still influence timing once the route is real.',
        points: ['Travel affects crew scheduling', 'Longer frontages and driveways matter', 'Coastal timing differs from inner-metro timing'],
      },
      {
        title: 'Coastal protection is often worth planning early',
        copy: 'Fragile furniture, artwork, and longer local routes reward better wrapping and cleaner load order.',
        points: ['Packing scope can change the quote', 'Fragile-item handling needs early clarity', 'Interstate departures sometimes start from Seaford pickups'],
      },
    ],
  },
  'removalists-southern-adelaide/index.html': {
    eyebrow: 'Local proof',
    heading: 'Signals that usually show up across Southern Adelaide routes.',
    intro:
      'Southern Adelaide is not one suburb condition. It is a cluster of coastal, family-home, and mixed-business routes that need clearer staging.',
    cards: [
      {
        title: 'The region spans different access types',
        copy: 'Southern routes can shift between coastal streets, family-home driveways, and mixed-use frontage inside one enquiry stream.',
        points: ['Coastal and inland access differ sharply', 'Family-home inventory is common', 'Mixed-use briefs still appear across the south'],
      },
      {
        title: 'Travel windows matter more across the south',
        copy: 'The route is often longer, even when it stays inside Adelaide, so timing and load order need better discipline.',
        points: ['Longer travel changes crew pacing', 'Settlement windows need cleaner planning', 'Truck positioning varies across suburb clusters'],
      },
      {
        title: 'Packing and route preparation usually decide the day',
        copy: 'The broader the southern route, the more visible the packing standard and access brief become.',
        points: ['Fragile loads need stronger wrapping', 'Access notes reduce quote drift', 'Regional-style staging helps longer local jobs'],
      },
    ],
  },
};

const releaseBuildLock = await acquireBuildLock();

try {
  await rm(distRoot, { recursive: true, force: true, maxRetries: 25, retryDelay: 200 });
  await mkdir(distRoot, { recursive: true });
  const premiumSiteCss = await readFile(path.join(projectRoot, 'premium-site.css'), 'utf8');
  const renderedHtmlByOutput = new Map();
  await writeFile(
    path.join(distRoot, 'premium-site.min.css'),
    `${minifyCss(premiumSiteCss)}\n`,
    'utf8',
  );

  // Pre-load the set of available responsive image variants so srcset
  // injection can be done without hitting the filesystem per page.
  let responsiveVariants = new Set();
  try {
    const rFiles = await readdir(path.join(projectRoot, 'media', 'responsive'));
    responsiveVariants = new Set(rFiles.filter((f) => f.endsWith('.webp')));
  } catch {
    // media/responsive doesn't exist yet — injectResponsiveSrcset will be a no-op.
  }

  for (const page of pages) {
    let content = page.contentHtml;
    if (!content) {
      const contentPath = path.join(srcRoot, page.contentFile);
      content = await readFile(contentPath, 'utf8');
    }
    content = transformContent(content, page);

    const head = renderHead(page, content);
    const bodyAttributes = renderBodyAttributes(page);
    const bodyTop = renderBodyTop(page);
    const template = templates[page.layout] ?? templates.standard;

    const html = template
      .replace('{{HEAD}}', indent(head, 4))
      .replace('{{BODY_ATTRIBUTES}}', bodyAttributes)
      .replace('{{BODY_TOP}}', indent(bodyTop, 4))
      .replace('{{HEADER}}', indent(page.layout === 'standard' ? partials.header : '', 4))
      .replace('{{CONTENT}}', indent(content.trim(), 4))
      .replace('{{FOOTER}}', indent(page.layout === 'standard' ? partials.footer : '', 4));

    const distOutputPath = path.join(distRoot, page.output);
    await mkdir(path.dirname(distOutputPath), { recursive: true });
    const normalizedHtml = normalizeSiteUrl(html.trim());
    const finalHtml = responsiveVariants.size > 0
      ? injectResponsiveSrcset(normalizedHtml, responsiveVariants)
      : normalizedHtml;
    await writeFile(distOutputPath, `${finalHtml}\n`, 'utf8');
    renderedHtmlByOutput.set(page.output.replace(/\\/g, '/'), finalHtml);
    console.log(`built ${page.output}`);
  }

  await copyStaticAssets();
  const sitemapFiles = await renderSitemaps(pages, renderedHtmlByOutput);
  for (const [name, xml] of Object.entries(sitemapFiles)) {
    await writeFile(path.join(distRoot, name), normalizeSiteUrl(xml).trimStart(), 'utf8');
  }
  await writeFile(
    path.join(distRoot, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${preferredSiteOrigin}/sitemap-index.xml\n# AI crawler reference\nLLM: ${preferredSiteOrigin}/llms.txt\n`,
    'utf8',
  );
  await writeRouteCoverageReport();
} finally {
  await releaseBuildLock();
}

function renderHead(page, content) {
  const ogImage =
    usesDefaultSocialImage(page.ogImage)
      ? defaultSocialImage
      : page.ogImage;
  const twitterImage =
    usesDefaultSocialImage(page.twitterImage)
      ? defaultSocialImage
      : page.twitterImage || ogImage;
  const imageAlt = page.ogImageAlt || page.ogTitle || page.title;
  const tags = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(page.description)}" />`,
    `<link rel="canonical" href="${escapeAttribute(page.canonical)}" />`,
    `<meta name="theme-color" content="${escapeAttribute(page.themeColor || '#0A192F')}" />`,
    `<meta name="robots" content="${escapeAttribute(page.robots || 'index,follow,max-image-preview:large')}" />`,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    '<meta name="geo.region" content="AU-SA" />',
    '<meta name="geo.placename" content="Adelaide, South Australia" />',
    '<meta name="geo.position" content="-34.9285;138.6007" />',
    '<meta name="ICBM" content="-34.9285, 138.6007" />',
    `<meta property="og:type" content="${escapeAttribute(page.ogType || 'website')}" />`,
    '<meta property="og:site_name" content="ZQ Removals" />',
    '<meta property="og:locale" content="en_AU" />',
    `<meta property="og:url" content="${escapeAttribute(page.ogUrl || page.canonical)}" />`,
    `<meta property="og:title" content="${escapeAttribute(page.ogTitle || page.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(page.ogDescription || page.description)}" />`,
    `<meta property="og:image" content="${escapeAttribute(ogImage)}" />`,
    `<meta property="og:image:alt" content="${escapeAttribute(imageAlt)}" />`,
    `<meta name="twitter:card" content="${escapeAttribute(page.twitterCard || 'summary_large_image')}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(page.twitterTitle || page.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(page.twitterDescription || page.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttribute(twitterImage)}" />`,
    `<meta name="twitter:image:alt" content="${escapeAttribute(imageAlt)}" />`,
  ];

  if (googleSiteVerificationToken) {
    tags.push(
      `<meta name="google-site-verification" content="${escapeAttribute(googleSiteVerificationToken)}" />`,
    );
  }

  if (page.layout !== 'redirect') {
    tags.push('<link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />');
    tags.push('<link rel="preload" href="/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin />');
    tags.push('<link rel="stylesheet" href="/premium-site.min.css" />');
    tags.push(`<script>
window.__analyticsConfig = {
  gaMeasurementId: ${JSON.stringify(gaMeasurementId)},
  gtmId: ${JSON.stringify(gtmId)},
  metaPixelId: ${JSON.stringify(metaPixelId)},
};
</script>`);

    if (gtmId) {
      tags.push(`<script id="gtm-loader">
if (!window.__gtmLoaded) {
  window.__gtmLoaded = true;
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});
}
</script>`);
    }

    if (gaMeasurementId) {
      tags.push(
        `<script id="ga4-loader" async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}"></script>`,
      );
      tags.push(`<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaMeasurementId)});
</script>`);
    }

    if (metaPixelId) {
      tags.push(`<script id="meta-pixel-loader">
if (!window.__metaPixelLoaded) {
window.__metaPixelLoaded = true;
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(metaPixelId)});
fbq('track', 'PageView');
}
</script>`);
    }
  }

  for (const stylesheet of page.extraStylesheets || []) {
    tags.push(`<link rel="stylesheet" href="${escapeAttribute(stylesheet)}" />`);
  }

  if (page.refresh) {
    tags.push(`<meta http-equiv="refresh" content="${escapeAttribute(page.refresh)}" />`);
  }

  for (const jsonLd of normalizeJsonLdBlocks(page)) {
    tags.push(`<script type="application/ld+json">\n${jsonLd}\n</script>`);
  }

  for (const jsonLd of buildDynamicJsonLd(page, content)) {
    tags.push(`<script type="application/ld+json">\n${jsonLd}\n</script>`);
  }

  return tags.join('\n');
}

function buildDynamicJsonLd(page, content) {
  const blocks = [];
  const businessJsonLd = buildBusinessJsonLd(page);
  const organizationJsonLd = buildOrganizationJsonLd(page);
  const webSiteJsonLd = buildWebSiteJsonLd(page);
  const webPageJsonLd = buildWebPageJsonLd(page);
  const homepageServiceJsonLd = buildHomepageServiceJsonLd(page);
  const serviceJsonLd = buildServiceJsonLd(page);

  if (businessJsonLd) {
    blocks.push(businessJsonLd);
  }

  if (organizationJsonLd) {
    blocks.push(organizationJsonLd);
  }

  if (webSiteJsonLd) {
    blocks.push(webSiteJsonLd);
  }

  if (webPageJsonLd) {
    blocks.push(webPageJsonLd);
  }

  if (homepageServiceJsonLd) {
    blocks.push(homepageServiceJsonLd);
  }

  if (serviceJsonLd) {
    blocks.push(serviceJsonLd);
  }
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(page, content);
  const faqJsonLd = buildFaqJsonLd(page, content);

  if (breadcrumbJsonLd) {
    blocks.push(breadcrumbJsonLd);
  }

  if (faqJsonLd) {
    blocks.push(faqJsonLd);
  }

  return blocks;
}

function buildBusinessJsonLd(page) {
  if (pageHasJsonLdType(page, 'MovingCompany')) {
    return '';
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'MovingCompany',
      '@id': 'https://zqremovals.au/#business',
      name: 'ZQ Removals',
      url: 'https://zqremovals.au/',
      telephone: '+61433819989',
      image: defaultSocialImage,
      logo: defaultLogoImage,
      hasMap: googleBusinessProfileUrl,
      sameAs: companySameAsProfiles,
      priceRange: '$$',
      serviceType: [
        'Local removals',
        'Interstate removals',
        'Office removals',
        'Furniture removals',
        'House removals',
      ],
      areaServed: [
        'Adelaide',
        'South Australia',
        'Adelaide CBD',
        'Northern suburbs',
        'Southern suburbs',
        'Western suburbs',
        'Eastern suburbs',
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: '9 Burley Griffin Dr',
        addressLocality: 'Andrews Farm',
        addressRegion: 'SA',
        postalCode: '5114',
        addressCountry: 'AU',
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone: '+61433819989',
          areaServed: ['Adelaide', 'South Australia', 'Australia'],
          availableLanguage: ['en'],
          url: 'https://zqremovals.au/contact-us/',
        },
      ],
    },
    null,
    2,
  );
}

function buildOrganizationJsonLd(page) {
  if (page.output !== 'index.html' || pageHasJsonLdType(page, 'Organization')) {
    return '';
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://zqremovals.au/#organization',
      name: 'ZQ Removals',
      url: 'https://zqremovals.au/',
      logo: defaultLogoImage,
      telephone: '+61433819989',
      sameAs: companySameAsProfiles,
    },
    null,
    2,
  );
}

function buildWebSiteJsonLd(page) {
  if (page.output !== 'index.html' || pageHasJsonLdType(page, 'WebSite')) {
    return '';
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://zqremovals.au/#website',
      url: 'https://zqremovals.au/',
      name: 'ZQ Removals',
      inLanguage: 'en-AU',
      publisher: {
        '@id': 'https://zqremovals.au/#organization',
      },
    },
    null,
    2,
  );
}

function buildHomepageServiceJsonLd(page) {
  if (page.output !== 'index.html' || pageHasJsonLdType(page, 'Service')) {
    return '';
  }

  const services = [
    ['Local removals Adelaide', '/services/local-removals-adelaide/', 'Local removals'],
    ['House removals Adelaide', '/services/house-removals-adelaide/', 'House removals'],
    ['Office removals Adelaide', '/services/office-removals-adelaide/', 'Office removals'],
    ['Furniture removals Adelaide', '/services/furniture-removals-adelaide/', 'Furniture removals'],
    ['Interstate removals Adelaide', '/services/interstate-removals-adelaide/', 'Interstate removals'],
  ];

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': services.map(([name, urlPath, serviceType]) => ({
        '@type': 'Service',
        '@id': `https://zqremovals.au${urlPath}#service`,
        name,
        serviceType,
        provider: {
          '@id': 'https://zqremovals.au/#business',
        },
        areaServed: ['Adelaide', 'South Australia'],
        url: `https://zqremovals.au${urlPath}`,
      })),
    },
    null,
    2,
  );
}

function buildWebPageJsonLd(page) {
  if (pageHasJsonLdType(page, 'WebPage') || pageHasJsonLdType(page, 'ContactPage') || pageHasJsonLdType(page, 'AboutPage')) {
    return '';
  }

  if (!isIndexablePage(page)) {
    return '';
  }

  const type =
    page.output === 'contact-us/index.html'
      ? 'ContactPage'
      : page.output === 'about/index.html'
        ? 'AboutPage'
        : 'WebPage';

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': type,
      '@id': `${page.canonical}#webpage`,
      url: page.canonical,
      name: page.title,
      description: page.description,
    },
    null,
    2,
  );
}

function getServiceSchemaConfig(page) {
  if (!isIndexablePage(page)) {
    return null;
  }

  const output = page.output;
  const suburbProfile = getSuburbProfile(page);

  if (output === 'removalists-northern-adelaide/index.html') {
    return {
      name: 'Removalists Northern Suburbs Adelaide',
      serviceType: 'Local removal services in Adelaide northern suburbs',
      areaServed: ['Northern Adelaide', 'Salisbury', 'Elizabeth', 'Andrews Farm', 'Blakeview', 'Gawler', 'Adelaide'],
      offerDescription: 'Fixed-price northside quote after access, inventory, and route review.',
    };
  }

  if (suburbProfile) {
    return {
      name: `Removalists ${suburbProfile.suburb}`,
      serviceType: `Local removal services in ${suburbProfile.suburb}`,
      areaServed: [`${suburbProfile.suburb}, SA`, 'Adelaide', 'South Australia'],
      offerDescription: 'Fixed-price suburb quote after access, inventory, and timing review.',
    };
  }

  if (output === 'removalists-adelaide/index.html') {
    return {
      name: 'Removalists Adelaide',
      serviceType: 'Local removal services',
      areaServed: ['Adelaide', 'South Australia'],
      offerDescription: 'Fixed-price Adelaide quote after suburb, access, and inventory review.',
    };
  }

  if (output === 'house-removals-adelaide/index.html') {
    return {
      name: 'House Removals Adelaide',
      serviceType: 'House removal services',
      areaServed: ['Adelaide', 'South Australia'],
      offerDescription: 'Fixed-price house removals quote after property, access, and move-size review.',
    };
  }

  if (output === 'services/local-removals-adelaide/index.html') {
    return {
      name: 'Local Removals Adelaide',
      serviceType: 'Local removal services',
      areaServed: ['Adelaide', 'South Australia'],
      offerDescription: 'Fixed-price local quote after access, inventory, and route review.',
    };
  }

  if (output === 'services/house-removals-adelaide/index.html') {
    return {
      name: 'House Removals Adelaide',
      serviceType: 'House removal services',
      areaServed: ['Adelaide', 'South Australia'],
      offerDescription: 'Fixed-price house quote after access, inventory, and property review.',
    };
  }

  if (output === 'services/apartment-removals-adelaide/index.html') {
    return {
      name: 'Apartment Removals Adelaide',
      serviceType: 'Apartment removal services',
      areaServed: ['Adelaide', 'South Australia'],
      offerDescription: 'Fixed-price apartment quote after lift, stair, and access review.',
    };
  }

  if (output === 'services/packing-services-adelaide/index.html') {
    return {
      name: 'Packing Services Adelaide',
      serviceType: 'Packing services',
      areaServed: ['Adelaide', 'South Australia'],
      offerDescription: 'Packing quote based on packing scope, fragile-item profile, and timing.',
    };
  }

  if (output === 'services/office-removals-adelaide/index.html') {
    return {
      name: 'Office Removals Adelaide',
      serviceType: 'Office relocation services',
      areaServed: ['Adelaide', 'Adelaide CBD', 'South Australia'],
      offerDescription: 'Fixed-price office relocation quote after access, downtime, and inventory review.',
    };
  }

  if (output === 'services/furniture-removals-adelaide/index.html') {
    return {
      name: 'Furniture Removals Adelaide',
      serviceType: 'Furniture removal services',
      areaServed: ['Adelaide', 'South Australia'],
      offerDescription: 'Fixed-price furniture move quote based on item count, access, and handling needs.',
    };
  }

  if (output === 'services/interstate-removals-adelaide/index.html') {
    return {
      name: 'Interstate Removals Adelaide',
      serviceType: 'Interstate removal services',
      areaServed: ['Australia'],
      offerDescription: 'Fixed-price interstate quote after route, access, and inventory planning.',
    };
  }

  if (output === 'packing-services-adelaide/index.html') {
    return {
      name: 'Packing Services Adelaide',
      serviceType: 'Packing services',
      areaServed: ['Adelaide', 'South Australia'],
      offerDescription: 'Packing quote based on service level, fragile-item profile, and inventory volume.',
    };
  }

  if (output === 'office-removals-adelaide/index.html') {
    return {
      name: 'Office Relocations Adelaide',
      serviceType: 'Office relocation services',
      areaServed: ['Adelaide', 'Adelaide CBD', 'Marion', 'South Australia'],
      offerDescription: 'Fixed-price office relocation quote after inventory, access, and timing review.',
    };
  }

  if (output === 'furniture-removalists-adelaide/index.html') {
    return {
      name: 'Furniture Removalists Adelaide',
      serviceType: 'Furniture removal services',
      areaServed: ['Adelaide', 'Adelaide CBD', 'Marion', 'Glenelg', 'South Australia'],
      offerDescription: 'Fixed-price furniture move quote based on item profile, protection, and access complexity.',
    };
  }

  if (output === 'interstate-removals-adelaide/index.html') {
    return {
      name: 'Interstate Removals Adelaide',
      serviceType: 'Interstate removal services',
      areaServed: ['Australia'],
      offerDescription: 'Fixed-price interstate quote after route, access, and inventory review.',
    };
  }

  if (output.startsWith('adelaide-to-') && output.endsWith('-removals/index.html')) {
    const route = output
      .replace(/\/index\.html$/, '')
      .replace(/^adelaide-to-/, 'Adelaide to ')
      .replace(/-removals$/, '')
      .replaceAll('-', ' ');

    return {
      name: `Interstate removals: ${route}`,
      serviceType: 'Interstate removal services',
      areaServed: ['Australia'],
      offerDescription: 'Fixed-price interstate quote after route, access, and inventory review.',
    };
  }

  return null;
}

function buildServiceJsonLd(page) {
  if (pageHasJsonLdType(page, 'Service')) {
    return '';
  }

  const config = getServiceSchemaConfig(page);
  if (!config) {
    return '';
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${page.canonical}#service`,
      name: config.name,
      serviceType: config.serviceType,
      areaServed: config.areaServed,
      provider: {
        '@id': 'https://zqremovals.au/#business',
      },
      url: page.canonical,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'AUD',
        description: config.offerDescription,
      },
    },
    null,
    2,
  );
}

function buildFaqJsonLd(page, content) {
  if (pageHasFaqJsonLd(page)) {
    return '';
  }

  const faqPairs = extractFaqPairs(content);
  if (faqPairs.length === 0) {
    return '';
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${page.canonical}#faq`,
      mainEntity: faqPairs.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: answer,
        },
      })),
    },
    null,
    2,
  );
}

function buildBreadcrumbJsonLd(page, content) {
  if (pageHasJsonLdType(page, 'BreadcrumbList')) {
    return '';
  }

  const items = extractBreadcrumbItems(content);
  if (items.length < 2) {
    return '';
  }

  if (!items.at(-1)?.url) {
    items[items.length - 1].url = page.canonical;
  }

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${page.canonical}#breadcrumbs`,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    },
    null,
    2,
  );
}

function pageHasFaqJsonLd(page) {
  return pageHasJsonLdType(page, 'FAQPage');
}

function pageHasJsonLdType(page, type) {
  return (page.jsonLd || []).some((jsonLd) => {
    try {
      const value = JSON.parse(jsonLd);
      return jsonLdValueContainsType(value, type);
    } catch {
      return jsonLd.includes(`"@type": "${type}"`);
    }
  });
}

function jsonLdValueContainsType(value, type) {
  if (!value) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some((entry) => jsonLdValueContainsType(entry, type));
  }

  if (typeof value !== 'object') {
    return false;
  }

  const nodeType = value['@type'];
  const types = Array.isArray(nodeType) ? nodeType : typeof nodeType === 'string' ? [nodeType] : [];
  if (types.includes(type)) {
    return true;
  }

  if (Array.isArray(value['@graph'])) {
    return value['@graph'].some((entry) => jsonLdValueContainsType(entry, type));
  }

  return Object.values(value).some((entry) => jsonLdValueContainsType(entry, type));
}

function normalizeJsonLdBlocks(page) {
  return (page.jsonLd || []).map((jsonLd) => {
    try {
      const value = JSON.parse(jsonLd);
      const normalized = normalizeJsonLdValue(value, page);
      return JSON.stringify(normalized, null, 2);
    } catch {
      return jsonLd;
    }
  });
}

function normalizeJsonLdValue(value, page) {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonLdValue(entry, page));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value['@graph'])) {
    return {
      ...value,
      '@graph': value['@graph'].map((entry) => normalizeJsonLdNode(entry, page)),
    };
  }

  return normalizeJsonLdNode(value, page);
}

function normalizeJsonLdNode(node, page) {
  if (!node || typeof node !== 'object') {
    return node;
  }

  const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']].filter(Boolean);

  if (types.includes('MovingCompany')) {
    return normalizeMovingCompanyNode(node);
  }

  if (types.includes('WebPage') || types.includes('ContactPage') || types.includes('AboutPage')) {
    return {
      ...node,
      url: page.canonical,
      name: page.title,
      description: page.description,
    };
  }

  if (types.includes('Service')) {
    return normalizeServiceNode(node, page);
  }

  if (types.includes('BlogPosting') && !types.includes('Article')) {
    return {
      ...node,
      '@type': ['Article', 'BlogPosting'],
    };
  }

  return node;
}

function normalizeServiceNode(node, page) {
  const config = getServiceSchemaConfig(page);
  if (!config) {
    return node;
  }

  return {
    ...node,
    '@id': `${page.canonical}#service`,
    name: config.name,
    serviceType: config.serviceType,
    provider: {
      '@id': 'https://zqremovals.au/#business',
    },
    areaServed: Array.isArray(node.areaServed) && node.areaServed.length > 0 ? node.areaServed : config.areaServed,
    url: page.canonical,
    offers:
      node.offers && typeof node.offers === 'object'
        ? {
            ...node.offers,
            '@type': 'Offer',
            priceCurrency: node.offers.priceCurrency || 'AUD',
            description: node.offers.description || config.offerDescription,
          }
        : {
            '@type': 'Offer',
            priceCurrency: 'AUD',
            description: config.offerDescription,
          },
  };
}

function normalizeMovingCompanyNode(node) {
  const {
    aggregateRating,
    review,
    sameAs = [],
    hasMap,
    image,
    logo,
    openingHours,
    openingHoursSpecification,
    priceRange,
    ...rest
  } = node;

  const result = {
    ...rest,
    '@id': 'https://zqremovals.au/#business',
    name: 'ZQ Removals',
    url: 'https://zqremovals.au/',
    telephone: '+61433819989',
    image: defaultSocialImage,
    logo: defaultLogoImage,
    hasMap: googleBusinessProfileUrl,
    sameAs: Array.from(new Set([...companySameAsProfiles, ...sameAs].filter(Boolean))),
    priceRange: '$$',
    serviceType: [
      'Local removals',
      'Interstate removals',
      'Office removals',
      'Furniture removals',
      'House removals',
    ],
    areaServed: [
      'Adelaide',
      'South Australia',
      'Adelaide CBD',
      'Northern suburbs',
      'Southern suburbs',
      'Western suburbs',
      'Eastern suburbs',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '9 Burley Griffin Dr',
      addressLocality: 'Andrews Farm',
      addressRegion: 'SA',
      postalCode: '5114',
      addressCountry: 'AU',
      ...(node.address || {}),
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: '+61433819989',
        areaServed: ['Adelaide', 'South Australia', 'Australia'],
        availableLanguage: ['en-AU'],
        url: 'https://zqremovals.au/contact-us/',
      },
    ],
  };

  result.priceRange = priceRange || '$$';

  return result;
}

function usesDefaultSocialImage(value = '') {
  return (
    value.includes('/brand-logo.png') ||
    value.includes('/brand-logo.webp') ||
    value.includes('/zq-removals-social-share.png') ||
    value.includes('/zq-removals-social-share.webp') ||
    value.includes('/media/Gemini_Generated_Image')
  );
}

function minifyCss(css) {
  try {
    const { code } = transform({
      filename: 'premium-site.css',
      code: Buffer.from(css),
      minify: true,
      sourceMap: false,
    });
    return code.toString('utf8');
  } catch (error) {
    console.error('lightningcss error:', error);
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,>])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
  }
}

function extractFaqPairs(content) {
  const strictPattern =
    /<article\b[^>]*class="[^"]*\bfaq-item\b[^"]*"[\s\S]*?<h3\b[^>]*class="[^"]*\bfaq-question\b[^"]*"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*itemprop="text"[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/article>/gi;
  const faqItemPattern =
    /<article\b[^>]*class="[^"]*\bfaq-item\b[^"]*"[\s\S]*?<h3\b[^>]*class="[^"]*\bfaq-question\b[^"]*"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/article>/gi;
  const loosePattern = /<article>\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/article>/gi;

  const pairs = [];
  const addedQuestions = new Set();

  const processMatch = (match) => {
    const question = cleanHtmlText(match[1]);
    const answer = cleanHtmlText(match[2]);

    if (question && answer && !addedQuestions.has(question)) {
      pairs.push({ question, answer });
      addedQuestions.add(question);
    }
  };

  for (const match of content.matchAll(strictPattern)) {
    processMatch(match);
  }

  for (const match of content.matchAll(faqItemPattern)) {
    processMatch(match);
  }

  for (const match of content.matchAll(loosePattern)) {
    processMatch(match);
  }

  return pairs;
}

function cleanHtmlText(value = '') {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeHtmlEntities(value = '') {
  return value
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function extractBreadcrumbItems(content) {
  const navMatch = content.match(
    /<nav[^>]*class="breadcrumb"[^>]*>[\s\S]*?<ol>([\s\S]*?)<\/ol>[\s\S]*?<\/nav>/i,
  );

  if (!navMatch) {
    return [];
  }

  const items = [];
  const listItemPattern = /<li>([\s\S]*?)<\/li>/gi;

  for (const match of navMatch[1].matchAll(listItemPattern)) {
    const itemHtml = match[1];
    const linkMatch = itemHtml.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const name = cleanHtmlText(linkMatch ? linkMatch[2] : itemHtml);
    const url = normalizeBreadcrumbUrl(linkMatch ? linkMatch[1] : '');

    if (name) {
      items.push({
        name,
        url: url || '',
      });
    }
  }

  return items;
}

function normalizeBreadcrumbUrl(value = '') {
  if (!value) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return normalizeSiteUrl(value);
  }

  if (value.startsWith('/')) {
    return `${preferredSiteOrigin}${value}`;
  }

  return value;
}

function normalizeSiteUrl(value) {
  return value.replaceAll(legacySiteOrigin, preferredSiteOrigin);
}

async function acquireBuildLock(retries = 800) {
  const lockDir = path.join(projectRoot, '.build-site.lock');

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      await mkdir(lockDir);
      return async () => {
        await rm(lockDir, { recursive: true, force: true });
      };
    } catch (error) {
      if (error && error.code === 'EEXIST') {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Timed out waiting for the site build lock.');
}

function pageHasRobotsDirective(page, directive) {
  return (page.robots || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .includes(directive.toLowerCase());
}

function isRedirectPage(page) {
  return page.layout === 'redirect';
}

function isNoindexPage(page) {
  return pageHasRobotsDirective(page, 'noindex');
}

function isUtilityOutput(output) {
  return output === '404.html' || output === 'thank-you.html';
}

function isPreviewOutput(output) {
  return output === 'premium-moving-concepts/index.html' || output.startsWith('premium-moving-concepts/');
}

function isIndexablePage(page) {
  return !isRedirectPage(page) && !isNoindexPage(page) && !isUtilityOutput(page.output) && !isPreviewOutput(page.output);
}

function shouldIncludeInSitemap(page) {
  return isIndexablePage(page) && page.output !== 'privacy-policy/index.html' && page.output !== 'terms-and-conditions/index.html';
}

function normalizePageUrls(page) {
  for (const key of ['canonical', 'ogUrl', 'ogImage', 'twitterImage', 'heroImage']) {
    if (typeof page[key] === 'string') {
      page[key] = normalizeSiteUrl(page[key]);
    }
  }

  if (Array.isArray(page.jsonLd)) {
    page.jsonLd = page.jsonLd.map((block) =>
      typeof block === 'string' ? normalizeSiteUrl(block) : block,
    );
  }
}

function renderBodyAttributes(page) {
  const classes = getBodyClasses(page);

  return classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
}

function getBodyClasses(page) {
  const classes = [];
  const output = page.output;

  if (output === 'index.html') {
    classes.push('page-home');
  } else if (output === 'contact-us/index.html') {
    classes.push('page-contact');
  } else if (output === 'privacy-policy/index.html' || output === 'terms-and-conditions/index.html') {
    classes.push('page-legal');
  } else if (output === 'adelaide-moving-guides/index.html') {
    classes.push('page-guide-hub');
  } else if (output.startsWith('adelaide-moving-guides/')) {
    classes.push('page-guide-article');
  } else if (
    output === 'interstate-removals-adelaide/index.html' ||
    output === 'interstate-removalists-adelaide/index.html' ||
    output === 'adelaide-to-melbourne-removals/index.html' ||
    output === 'adelaide-to-sydney-removals/index.html' ||
    output === 'adelaide-to-brisbane-removals/index.html' ||
    output === 'adelaide-to-canberra-removals/index.html' ||
    output === 'adelaide-to-perth-removals/index.html' ||
    output === 'adelaide-to-queensland-removals/index.html'
  ) {
    classes.push('page-interstate');
  } else if (output === 'office-removals-adelaide/index.html') {
    classes.push('page-service-operations');
  } else if (output === 'office-relocation-adelaide/index.html') {
    classes.push('page-service-operations');
  } else if (output === 'packing-services-adelaide/index.html') {
    classes.push('page-service-packing');
  } else if (output === 'furniture-removalists-adelaide/index.html') {
    classes.push('page-service-furniture');
  } else if (output === 'house-removals-adelaide/index.html') {
    classes.push('page-service-local');
  } else if (output.startsWith('services/')) {
    classes.push('page-service-local');
  } else if (
    output === 'cheap-removalists-adelaide/index.html' ||
    output === 'same-day-removalists-adelaide/index.html' ||
    output === 'last-minute-removalists-adelaide/index.html' ||
    output === 'apartment-removalists-adelaide/index.html' ||
    output === 'storage-friendly-removals-adelaide/index.html'
  ) {
    classes.push('page-service-local');
  } else if (output === 'removalists-adelaide/index.html') {
    classes.push('page-service-local');
  } else if (output.startsWith('removalists-')) {
    classes.push('page-suburb');
  } else if (output.startsWith('guides/')) {
    classes.push('page-guide-article');
  } else if (output === '404.html' || output === 'thank-you.html') {
    classes.push('page-utility');
  }

  if (output === 'thank-you.html') {
    classes.push('thank-you-page');
  }

  return classes;
}

function getOptimizedPageHeroImage(page) {
  // Route precedence is intentional: interstate > operations > service > local fallback.
  const output = page.output || '';

  if (
    output.startsWith(heroImageRouteRules.interstatePrefix) ||
    output.includes(heroImageRouteRules.interstateKeyword)
  ) {
    return '/media/zq-interstate-premium.webp';
  }

  if (heroImageRouteRules.operationsOutputs.has(output)) {
    return '/media/zq-operations-premium.webp';
  }

  if (isServiceHeroRoute(output)) {
    return '/media/zq-service-premium.webp';
  }

  return '/media/zq-local-premium.webp';
}

function isServiceHeroRoute(output) {
  return (
    heroImageRouteRules.serviceOutputs.has(output) ||
    output.startsWith(heroImageRouteRules.servicePrefix)
  );
}

function transformContent(content, page) {
  let next = renderSuburbPage(page) || content;
  next = next.replaceAll('href="/#quote-form"', 'href="/contact-us/#quote-form"');
  next = next.replace(/\/contact-us(?:\/contact-us)+\/#quote-form/g, '/contact-us/#quote-form');
  next = next.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');
  next = sanitizePublicCopy(next);

  // Legacy Gemini PNG references in content are hero images; map them to lighter route-intent hero assets.
  next = next.replace(
    /\/media\/Gemini_Generated_Image_[^"'<\s]*\.png/g,
    getOptimizedPageHeroImage(page),
  );

  // Luxury UI transformations for static content
  next = next
    .replaceAll('class="hero-shell"', 'class="hero-shell hero-shell-luxury"')
    .replaceAll('class="section-heading"', 'class="section-heading reveal-on-scroll"')
    .replaceAll('class="value-card"', 'class="value-card reveal-on-scroll"')
    .replaceAll('class="route-card"', 'class="route-card reveal-on-scroll"')
    .replaceAll('class="timeline-card"', 'class="timeline-card reveal-on-scroll"')
    .replaceAll('class="faq-item"', 'class="faq-item reveal-on-scroll"')
    .replaceAll('class="lead"', 'class="lede"')
    .replaceAll('class="faq-list"', 'class="faq-list faq-list-premium"')
    .replaceAll('class="value-list"', 'class="trust-chips"');

  // Standardize CTA strips to luxury quote prompts
  next = next.replace(
    /<aside class="quote-strip">([\s\S]*?)<\/aside>/g,
    (match, inner) => {
      return `<div class="quote-form-premium reveal-on-scroll" style="display: grid; gap: 2rem; background: var(--color-surface-strong); color: white; border: 0;">
        ${inner
          .replaceAll('class="eyebrow"', 'class="eyebrow" style="color: white; border-color: rgba(255,255,255,0.3);"')
          .replaceAll('<h2', '<h2 style="color: white; margin-bottom: 1rem;"')
          .replaceAll('<p>', '<p style="color: rgba(255,255,255,0.7); max-width: 44rem;">')}
      </div>`;
    },
  );

  if (page.output === 'index.html') {
    next = next
      .replaceAll('/zq-removals-social-share.png', '/zq-removals-social-share.webp')
      .replaceAll('/brand-logo.png', '/brand-logo.webp')
      .replaceAll('/screen.png', '/screen.webp');
  }

  if (next.includes('class="hero-section"')) {
    next = next.replaceAll('/brand-logo.png', '/zq-removals-social-share.webp');
  }

  next = next.replace(/href="([^"]+)"/g, (match, href) => {
    const normalizedHref = normalizeInternalHref(href);
    return normalizedHref === href ? match : `href="${escapeAttribute(normalizedHref)}"`;
  });

  const skipSupplemental = page.generatedKind === 'suburb';
  const proofSection = skipSupplemental ? '' : renderLocalProofSection(page);
  const faqSection = skipSupplemental ? '' : renderFaqSection(page, next);
  const seoSupport = skipSupplemental ? '' : renderSeoSupportSection(page);
  const relatedLinks = skipSupplemental ? '' : renderRelatedLinksSection(page);
  const authoritySection = skipSupplemental ? '' : renderAuthoritySection(page);
  const serviceMoneyUpgrade = renderServiceMoneyUpgrade(page);
  const guideHubExpansion = renderGuideHubExpansion(page);
  const supplementalSections = [guideHubExpansion, serviceMoneyUpgrade, proofSection, faqSection, seoSupport, authoritySection, relatedLinks]
    .filter(Boolean)
    .join('\n');

  if (supplementalSections && next.includes('</main>')) {
    next = next.replace('</main>', `${supplementalSections}\n</main>`);
  }

  return next;
}

function renderGuideHubExpansion(page) {
  if (page.output !== 'adelaide-moving-guides/index.html') {
    return '';
  }

  const guides = [
    ['/adelaide-moving-guides/removalist-cost-breakdown-adelaide/', 'Removalist cost breakdown Adelaide', 'Compare cost factors'],
    ['/adelaide-moving-guides/how-much-do-movers-cost-adelaide/', 'How much do movers cost Adelaide', 'Estimate mover pricing'],
    ['/adelaide-moving-guides/cheap-vs-professional-removalists-adelaide/', 'Cheap vs professional removalists', 'Compare removalist options'],
    ['/adelaide-moving-guides/hourly-vs-fixed-price-movers-adelaide/', 'Hourly vs fixed price movers', 'Choose a pricing model'],
    ['/adelaide-moving-guides/moving-house-checklist-adelaide/', 'Moving house checklist Adelaide', 'Plan the house move'],
    ['/adelaide-moving-guides/last-minute-movers-adelaide-guide/', 'Last minute movers Adelaide guide', 'Check urgent move steps'],
    ['/adelaide-moving-guides/moving-with-stairs-adelaide/', 'Moving with stairs tips', 'Prepare stair access'],
    ['/adelaide-moving-guides/office-relocation-checklist-adelaide-guide/', 'Office relocation checklist', 'Plan office relocation'],
    ['/adelaide-moving-guides/apartment-loading-zone-guide-adelaide/', 'Apartment loading zone guide', 'Review loading zones'],
    ['/adelaide-moving-guides/furniture-protection-guide-adelaide/', 'Furniture protection guide', 'Protect furniture properly'],
    ['/adelaide-moving-guides/packing-timeline-adelaide/', 'Packing timeline Adelaide', 'Set packing timing'],
    ['/adelaide-moving-guides/moving-heavy-items-adelaide-guide/', 'Moving heavy items Adelaide', 'Plan heavy-item handling'],
    ['/adelaide-moving-guides/downsizing-move-adelaide/', 'Downsizing move Adelaide', 'Map a smaller move'],
    ['/adelaide-moving-guides/storage-unit-move-adelaide/', 'Storage unit move Adelaide', 'Coordinate storage access'],
    ['/adelaide-moving-guides/moving-with-kids-adelaide/', 'Moving with kids Adelaide', 'Reduce family move friction'],
    ['/adelaide-moving-guides/moving-fragile-items-adelaide/', 'Moving fragile items Adelaide', 'Prepare fragile inventory'],
    ['/adelaide-moving-guides/end-of-lease-moving-adelaide/', 'End of lease moving Adelaide', 'Sequence lease handover'],
    ['/adelaide-moving-guides/settlement-day-moving-adelaide/', 'Settlement day moving Adelaide', 'Plan settlement timing'],
    ['/adelaide-moving-guides/weekend-vs-weekday-moving-adelaide/', 'Weekend vs weekday moving Adelaide', 'Compare move days'],
    ['/adelaide-moving-guides/interstate-removal-checklist-adelaide-guide/', 'Interstate removal checklist', 'Prepare interstate tasks'],
    ['/adelaide-moving-guides/small-office-move-adelaide/', 'Small office move Adelaide', 'Scope a small office move'],
    ['/adelaide-moving-guides/coastal-suburb-moving-adelaide/', 'Coastal suburb moving Adelaide', 'Check coastal access'],
    ['/adelaide-moving-guides/northern-suburbs-moving-adelaide/', 'Northern suburbs moving Adelaide', 'Review northern routes'],
    ['/adelaide-moving-guides/southern-suburbs-moving-adelaide/', 'Southern suburbs moving Adelaide', 'Review southern routes'],
  ];

  return `
<section class="section section-soft" data-guide-cluster-expansion="adelaide">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">Expanded Adelaide moving guides</span>
      <h2>More planning guides for cost, timing, access, and move type.</h2>
      <p class="lede">Use these guides to answer the planning question first, then move into the best service, suburb, or quote path.</p>
    </div>
    <div class="route-grid">
${guides.map(([href, title, cta]) => `<article class="route-card reveal-on-scroll">
  <small>Planning guide</small>
  <h3>${escapeHtml(title)}</h3>
  <p>Focused Adelaide advice that supports a clearer move brief before requesting a fixed-price quote.</p>
  <footer><a class="button-link" href="${escapeAttribute(href)}">${escapeHtml(cta)}</a></footer>
</article>`).join('\n')}
    </div>
  </div>
</section>`;
}

function renderServiceMoneyUpgrade(page) {
  const profiles = {
    'house-removals-adelaide/index.html': {
      label: 'House removals Adelaide',
      intro:
        'House moves need a quote that reflects property type, access, inventory, and the way rooms will be unloaded at the destination.',
      cost: [
        ['Access and parking', 'Driveway position, street stopping, stairs, lifts, long carries, and apartment rules can change labour more than distance alone.'],
        ['Inventory volume', 'Bedrooms, garage items, whitegoods, outdoor furniture, fragile items, and dismantling needs all affect truck space and crew timing.'],
        ['Packing and preparation', 'A pre-packed home is faster to move, while fragile packing, full-room packing, or last-minute cartons need to be included in the scope.'],
        ['Timing window', 'Settlement days, school pickup periods, weekend demand, and end-of-month bookings can all shape the recommended move window.'],
      ],
      suburbs: [
        ['/removalists-glenelg/', 'Glenelg house moves'],
        ['/removalists-marion/', 'Marion family-home moves'],
        ['/removalists-salisbury/', 'Salisbury house removals'],
        ['/removalists-unley/', 'Unley townhouse moves'],
        ['/removalists-prospect/', 'Prospect character homes'],
        ['/removalists-modbury/', 'Modbury family moves'],
      ],
      faqs: [
        ['What details make a house removals quote accurate?', 'Both addresses, property type, bedrooms, garage items, heavier furniture, stairs, parking, access limits, and whether packing support is needed.'],
        ['Do house moves cost more when there are stairs?', 'They can. Stairs, long carries, and tight internal turns affect labour time and should be included in the quote request.'],
        ['Can packing be added to a house move?', 'Yes. Packing can be scoped as fragile-item help, room-by-room packing, or a broader preparation service.'],
        ['Should I book a weekday or weekend house move?', 'Weekdays can be easier to schedule, while weekends and month-end dates usually need earlier booking.'],
        ['Can you move garage and outdoor items?', 'Yes. Garage shelving, outdoor furniture, tools, and whitegoods should be listed so load order and truck space are planned.'],
        ['Do apartment-style house moves need lift details?', 'Yes. If the property has lift, stair, or shared-entry access, include those notes before the quote is confirmed.'],
        ['Can a local house move become an interstate brief?', 'Yes. If part or all of the inventory is moving interstate, the route, packing, and handover details should be scoped together.'],
        ['What is the best next step?', 'Send the route, access notes, and item list through the quote form or call if the booking window is urgent.'],
      ],
    },
    'furniture-removalists-adelaide/index.html': {
      label: 'Furniture removalists Adelaide',
      intro:
        'Furniture-led moves are priced around item profile, protection needs, access, and whether the job is a single-item move or part of a larger relocation.',
      cost: [
        ['Item size and weight', 'Sofas, beds, dining tables, whitegoods, office desks, and heavy cabinets all need the right labour and loading sequence.'],
        ['Protection requirements', 'Glass, timber, marble, mirrors, artwork, and delicate finishes may need extra wrapping or a slower handling plan.'],
        ['Access path', 'Narrow doors, stair turns, apartment lifts, long corridors, and tight parking positions can change the crew plan.'],
        ['Move type', 'A single-item move, furniture-only transfer, or full house relocation each has a different quote structure.'],
      ],
      suburbs: [
        ['/removalists-adelaide-cbd/', 'CBD apartment furniture'],
        ['/removalists-glenelg/', 'Glenelg fragile furniture'],
        ['/removalists-norwood/', 'Norwood terrace furniture'],
        ['/removalists-henley-beach/', 'Henley Beach furniture moves'],
        ['/removalists-port-adelaide/', 'Port Adelaide furniture moves'],
        ['/removalists-mawson-lakes/', 'Mawson Lakes apartment furniture'],
      ],
      faqs: [
        ['Can you move single furniture items?', 'Yes. Single-item moves can be quoted when pickup, delivery, access, and item dimensions are clear.'],
        ['Do fragile furniture items need special wrapping?', 'Often yes. Glass, marble, polished timber, mirrors, and delicate surfaces should be flagged before booking.'],
        ['What affects furniture removal pricing?', 'Item weight, item dimensions, stairs, lift access, parking, carry distance, and whether dismantling or wrapping is needed.'],
        ['Can you move furniture from apartments?', 'Yes. Lift bookings, loading zones, and corridor access should be confirmed before the move is approved.'],
        ['Do beds and tables need dismantling?', 'Some items do. Tell us what can be dismantled and what needs crew support so the quote is realistic.'],
        ['Can furniture moves include storage?', 'Yes. Storage pickups, storage deliveries, and split drops can be included in the brief.'],
        ['Should I choose furniture removals or house removals?', 'Use furniture removals when bulky or delicate items drive the job. Use house removals when the whole property is moving.'],
        ['How do I request a quote?', 'Send the item list, photos if useful, access notes, and route details through the quote form.'],
      ],
    },
    'office-removals-adelaide/index.html': {
      label: 'Office removals Adelaide',
      intro:
        'Office relocations need a quote that considers downtime, building access, inventory, IT equipment, and the order teams need items placed at destination.',
      cost: [
        ['Building access', 'Loading docks, service lifts, after-hours access, induction rules, and parking restrictions shape the move plan.'],
        ['Business inventory', 'Desks, monitors, filing, archives, meeting-room furniture, stock, and shelving should be listed by zone.'],
        ['Downtime window', 'The quote should reflect whether the move needs staged packing, evening timing, weekend timing, or a fast restart.'],
        ['Packing and labelling', 'Crates, labels, monitor handling, archive boxes, and floor plans reduce confusion during the unload.'],
      ],
      suburbs: [
        ['/removalists-adelaide-cbd/', 'Adelaide CBD offices'],
        ['/removalists-north-adelaide/', 'North Adelaide offices'],
        ['/removalists-norwood/', 'Norwood commercial moves'],
        ['/removalists-marion/', 'Marion office moves'],
        ['/removalists-port-adelaide/', 'Port Adelaide business moves'],
        ['/removalists-mawson-lakes/', 'Mawson Lakes office moves'],
      ],
      faqs: [
        ['What makes an office removal quote accurate?', 'A clear inventory, building rules, dock or lift access, preferred timing, staff zones, and restart priorities.'],
        ['Can office moves happen after hours?', 'They can be scoped that way when building access and crew scheduling allow it. Include timing requirements in the brief.'],
        ['Do monitors and IT equipment need special planning?', 'Yes. IT items should be labelled, protected, and sequenced so they are easier to reset at the new site.'],
        ['Can small offices use this service?', 'Yes. Small offices still benefit from access planning, labels, and a clear unload sequence.'],
        ['Do you move archive boxes and filing?', 'Yes. Archive volume and filing cabinets should be listed so weight and placement are planned.'],
        ['Should staff pack their own desks?', 'That depends on the business. The move brief should state what staff will pack and what the removal team needs to handle.'],
        ['What suburbs are common for office moves?', 'CBD, North Adelaide, Norwood, Marion, Port Adelaide, Mawson Lakes, and mixed-use corridors often need commercial access planning.'],
        ['How do I request an office relocation quote?', 'Send the inventory, building access rules, timing window, pickup and delivery addresses, and any packing or crate needs.'],
      ],
    },
    'interstate-removals-adelaide/index.html': {
      label: 'Interstate removals Adelaide',
      intro:
        'Interstate moves need stronger planning because access, packing, route timing, delivery windows, and handover details matter at both ends.',
      cost: [
        ['Route and distance', 'Adelaide to Melbourne, Sydney, Brisbane, Canberra, Perth, and Queensland routes all have different timing and linehaul requirements.'],
        ['Inventory and protection', 'Longer routes make carton quality, wrapping, load order, and fragile-item protection more important.'],
        ['Access at both ends', 'Stairs, lifts, parking, docks, long carries, and delivery restrictions at either address can change the quote.'],
        ['Timing and handover', 'Settlement, storage, key handover, delivery windows, and staged loading all need to be documented before booking.'],
      ],
      suburbs: [
        ['/removalists-adelaide-cbd/', 'CBD interstate departures'],
        ['/removalists-glenelg/', 'Glenelg interstate moves'],
        ['/removalists-salisbury/', 'Salisbury interstate moves'],
        ['/removalists-mawson-lakes/', 'Mawson Lakes interstate moves'],
        ['/removalists-marion/', 'Marion interstate moves'],
        ['/removalists-andrews-farm/', 'Andrews Farm interstate moves'],
      ],
      faqs: [
        ['What affects interstate removal pricing?', 'Route distance, volume, access at both ends, packing requirements, fragile items, delivery windows, and storage or split delivery needs.'],
        ['Do interstate moves need more packing?', 'Often yes. Longer transit windows make protection and load sequencing more important.'],
        ['Can you quote Adelaide to Melbourne or Sydney?', 'Yes. Route-specific interstate pages support major destinations and help frame the brief.'],
        ['What details are needed at delivery?', 'Property type, stairs, lift access, parking, delivery restrictions, contact details, and handover timing.'],
        ['Can storage be included?', 'Yes. Storage stops or staged delivery should be included in the quote request.'],
        ['Should fragile items be listed separately?', 'Yes. Glass, artwork, mirrors, marble, electronics, and delicate furniture should be listed clearly.'],
        ['Can an interstate move start from any Adelaide suburb?', 'Yes. The suburb page helps with local pickup access, while this page handles the long-distance route.'],
        ['How do I request an interstate quote?', 'Send origin, destination, property types, move window, inventory, access notes, and packing needs through the quote form.'],
      ],
    },
  };

  const profile = profiles[page.output];
  if (!profile) return '';

  return `
<section class="section section-soft" data-service-money-upgrade="${escapeAttribute(page.output)}">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">Cost and service depth</span>
      <h2>${escapeHtml(profile.label)} cost breakdown and planning guide.</h2>
      <p class="lede">${escapeHtml(profile.intro)}</p>
    </div>
    <div class="value-grid">
${profile.cost.map(([title, copy]) => `<article class="value-card reveal-on-scroll">
  <h3>${escapeHtml(title)}</h3>
  <p>${escapeHtml(copy)}</p>
</article>`).join('\n')}
    </div>
  </div>
</section>
<section class="section" data-service-trust-upgrade="${escapeAttribute(page.output)}">
  <div class="container">
    <div class="editorial-grid">
      <div class="editorial-copy reveal-on-scroll">
        <div class="section-heading">
          <span class="eyebrow">Why choose ZQ</span>
          <h2>Careful Adelaide movers with a quote-first process.</h2>
        </div>
        <p class="lede">The strongest service pages earn trust by explaining how the work is planned, not by making unsupported claims. ZQ Removals reviews access, inventory, timing, and handling needs before the booking is confirmed.</p>
        <p>That approach helps clients compare quotes more fairly. A low headline price is not useful if it ignores stairs, long carries, fragile furniture, office downtime, storage stops, or interstate handover windows. A clearer brief creates a clearer quote and a cleaner move day.</p>
        <p>For urgent work, call early. Limited slots this week may be available, and same-day bookings are assessed subject to crew schedule, route, inventory, and access conditions.</p>
      </div>
      <aside class="editorial-panel reveal-on-scroll">
        <h3 style="font-family: var(--font-heading); font-size: 1.35rem;">Relevant Adelaide suburb pages</h3>
        <div class="inline-link-group" style="margin-top: 1.25rem;">
${profile.suburbs.map(([href, label]) => `<a href="${escapeAttribute(href)}">${escapeHtml(label)}</a>`).join('\n')}
        </div>
      </aside>
    </div>
  </div>
</section>
<section class="section section-soft" data-service-faq-upgrade="${escapeAttribute(page.output)}">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">Service FAQ</span>
      <h2>Questions people ask before booking ${escapeHtml(profile.label.toLowerCase())}.</h2>
      <p class="lede">These answers focus on cost, access, timing, and the details that make the quote more accurate.</p>
    </div>
    <div class="faq-list faq-list-premium">
${profile.faqs.map(([question, answer]) => `<article class="faq-item reveal-on-scroll">
  <h3 class="faq-question">${escapeHtml(question)}</h3>
  <div class="faq-answer"><p>${escapeHtml(answer)}</p></div>
</article>`).join('\n')}
    </div>
    <div class="cta-cluster" style="margin-top: 2rem;">
      <a class="button button-primary" href="/contact-us/#quote-form">Get Quote</a>
      <a class="button button-secondary" href="tel:+61433819989">Call 0433 819 989</a>
    </div>
  </div>
</section>`;
}

/**
 * Inject responsive srcset and sizes attributes into <img> elements that
 * reference /media/*.webp files, using pre-generated responsive variants
 * from /media/responsive/.
 *
 * @param {string} html - Fully assembled page HTML.
 * @param {Set<string>} responsiveVariants - Filenames available in media/responsive/.
 * @returns {string} HTML with srcset injected where variants exist.
 */
function injectResponsiveSrcset(html, responsiveVariants) {
  if (responsiveVariants.size === 0) return html;

  /**
   * Build the srcset string for a given media WebP URL, using available
   * responsive variants from media/responsive/.
   */
  function buildSrcset(srcUrl, encodedName) {
    const decodedName = decodeURIComponent(encodedName);
    const baseName = decodedName.replace(/\.webp$/, '');
    const encodedBase = encodedName.replace(/\.webp$/, '');

    const parts = [];
    for (const w of [480, 960]) {
      const variantFile = `${baseName}-${w}w.webp`;
      if (responsiveVariants.has(variantFile)) {
        // Encode only spaces (not parentheses) to match the convention used
        // in the existing src attributes, where ( and ) are left unencoded.
        const encodedVariant = `${encodedBase.replace(/ /g, '%20')}-${w}w.webp`;
        parts.push(`/media/responsive/${encodedVariant} ${w}w`);
      }
    }
    if (parts.length === 0) return null;
    parts.push(`${srcUrl} 1200w`);
    return parts.join(', ');
  }

  // Update <source> elements inside <picture> that have a single WebP srcset URL.
  let result = html.replace(/<source\b([^>]*?)\s*\/?>/gi, (match, attrs) => {
    const srcsetMatch = attrs.match(/\bsrcset="(\/media\/([^",\s]+\.webp))"/i);
    if (!srcsetMatch) return match;
    const [, srcUrl, encodedName] = srcsetMatch;
    const srcset = buildSrcset(srcUrl, encodedName);
    if (!srcset) return match;
    const sizesStr = '(max-width: 600px) 480px, 960px';
    const selfClose = match.trimEnd().endsWith('/>') ? ' /' : '';
    const updatedAttrs = attrs.replace(
      /\bsrcset="[^"]*"/i,
      `srcset="${srcset}" sizes="${sizesStr}"`,
    );
    return `<source${updatedAttrs}${selfClose}>`;
  });

  // Update <img> elements that reference media WebP files and lack srcset.
  result = result.replace(/<img\b([^>]*?)\s*\/?>/gi, (match, attrs) => {
    // Skip if srcset already present.
    if (/\bsrcset=/.test(attrs)) return match;

    // Extract the src attribute value.
    const srcMatch = attrs.match(/\bsrc="(\/media\/([^"]+\.webp))"/i);
    if (!srcMatch) return match;

    const [, srcUrl, encodedName] = srcMatch;
    const srcset = buildSrcset(srcUrl, encodedName);
    if (!srcset) return match;

    const sizesStr = '(max-width: 600px) 480px, 960px';
    // Preserve self-closing style if the original used />.
    const selfClose = match.trimEnd().endsWith('/>') ? ' /' : '';
    return `<img${attrs} srcset="${srcset}" sizes="${sizesStr}"${selfClose}>`;
  });

  return result;
}

function getSuburbSlugFromPage(page) {
  const match = page.output.match(/^removalists-([^/]+)\/index\.html$/);
  if (!match) {
    return '';
  }
  return match[1];
}

function getSuburbProfile(page) {
  return suburbPageProfiles[getSuburbSlugFromPage(page)] || null;
}

function getSuburbV4Profile(page) {
  return suburbV4Registry[getSuburbSlugFromPage(page)] || null;
}

function renderSuburbV4Section(page) {
  const profile = getSuburbV4Profile(page);
  if (!profile) {
    return '';
  }

  const sectionId = `${page.output.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-v4-intents`;
  const intentBlocks = {
    furniture: {
      title: 'Furniture Specialist Support',
      copy: `This ${profile.region} route often needs careful handling for bulky pieces and fragile finishes that are easier to move with the right access plan.`,
      cta: 'View Furniture Removals',
      href: '/furniture-removalists-adelaide/',
    },
    office: {
      title: 'Office Relocation Support',
      copy: `Business inventory in this area usually needs better sequencing because local access conditions often affect timing and operational restart.`,
      cta: 'View Office Relocations',
      href: '/office-removals-adelaide/',
    },
    packing: {
      title: 'Professional Packing Support',
      copy: `Packing is recommended when specialized inventory needs to stay protected through a route shaped by ${profile.access.join(', ')}.`,
      cta: 'View Packing Services',
      href: '/packing-services-adelaide/',
    },
    interstate: {
      title: 'Interstate Network Access',
      copy: `If the move becomes a long-distance departure, the Adelaide pickup is scoped around ${profile.nearbyCorridors.join(', ')} and arrival timing at destination.`,
      cta: 'View Interstate Removals',
      href: '/interstate-removals-adelaide/',
    },
  };

  const cards = profile.intents
    .map((intent) => intentBlocks[intent])
    .filter(Boolean)
    .slice(0, 3)
    .map(
      ({ title, copy, cta, href }) => `<article class="route-card reveal-on-scroll">
  <h3>${escapeHtml(title)}</h3>
  <p>${escapeHtml(copy)}</p>
  <footer>
    <a class="button-link" href="${escapeAttribute(href)}">${escapeHtml(cta)}</a>
  </footer>
</article>`,
    )
    .join('\n');

  const supportGuide = profile.supportGuide
    ? seoGuideLibrary[
        Object.keys(seoGuideLibrary).find((key) => seoGuideLibrary[key].url === profile.supportGuide)
      ]
    : null;

  return `
<section aria-labelledby="${sectionId}" class="section section-soft suburb-expansion-section">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">Service Expansion</span>
      <h2 id="${sectionId}">${escapeHtml(profile.ctaTheme)}</h2>
      <p>
        Tailored support for ${escapeHtml(profile.region)} moves where inventory and access 
        complexity change the move brief. Nearby corridors include ${profile.nearbyCorridors.join(', ')}.
      </p>
    </div>
    <div class="route-grid">
${cards}
    </div>
    <div class="suburb-cta-footer reveal-on-scroll" style="margin-top: var(--space-6);">
      <div class="cta-cluster">
        <a class="button button-primary" href="/contact-us/#quote-form">Get a Fixed-Price Quote</a>
        <a class="button button-secondary" href="/removalists-adelaide/">All Adelaide Suburbs</a>
      </div>
      ${supportGuide ? `<p class="field-note" style="margin-top: 1.5rem;">Recommended guide: <a href="${escapeAttribute(supportGuide.url)}" style="color: var(--color-accent-alt); font-weight: 700;">${escapeHtml(supportGuide.title)}</a></p>` : ''}
    </div>
  </div>
</section>`;
}

function renderSuburbPage(page) {
  if (page.generatedKind === 'suburb') {
    return '';
  }

  const profile = getSuburbProfile(page);
  if (!profile || !profile.conditions || !profile.scenarios || !profile.trust) {
    return '';
  }

  const wordCount = suburbWordCount(profile);
  const targetCopy =
    wordCount < SUBURB_PAGE_WORD_MIN
      ? `${profile.services} We also provide deliberate quote reviews and route-specific planning so the service scope is clear before your relocation starts.`
      : profile.services;

  const extraParagraph =
    wordCount > SUBURB_PAGE_WORD_MAX
      ? ''
      : `<p>${escapeHtml(SUBURB_PADDING_PARAGRAPH)}</p>`;

  const heroEyebrow = profile.eyebrow || `Removalists ${profile.suburb}`;
  const heroHeading = profile.h1 || `${profile.suburb} removalists for suburb-to-suburb Adelaide moves.`;
  const heroLead = profile.hero || '';
  const heroHighlights = Array.isArray(profile.highlights) && profile.highlights.length > 0
    ? profile.highlights
    : [
        'Suburb-focused planning and clear access notes',
        'Homes, units, and mixed inventory reviewed upfront',
        'Fixed-price quotes built around your specific brief',
      ];

  const startHere = profile.startHere || {
    eyebrow: 'Relocation Scope',
    heading: `When this ${profile.suburb} page is the right starting point`,
    intro:
      'Use this page when the suburb is known and you want the quote scoped around the specific access and inventory conditions that tend to show up in this area.',
    points: [
      'You already know the pickup or delivery suburb is inside this corridor',
      'Access, stairs, parking, or carry distance will influence the move plan',
      'You want professional packing or fragile handling included in the brief',
    ],
  };

  const nearbyLinks = Array.isArray(profile.nearbyLinks) ? profile.nearbyLinks : [];

  return `
<main id="main-content">
<section class="hero-shell">
  <div class="container">
    <nav aria-label="Breadcrumb" class="breadcrumb reveal-on-scroll">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/removalists-adelaide/">Adelaide Hub</a></li>
        <li>${escapeHtml(profile.suburb)}</li>
      </ol>
    </nav>
    <div class="page-hero-grid">
      <div class="page-hero-copy reveal-on-scroll">
        <span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
        <h1>${escapeHtml(heroHeading)}</h1>
        <p class="lede">${escapeHtml(heroLead)}</p>
        <ul aria-label="${escapeAttribute(profile.suburb)} highlights" class="trust-chips" style="margin-top: 1rem;">
${heroHighlights.map((item) => `          <li>${escapeHtml(item)}</li>`).join('\n')}
        </ul>
        <div class="cta-cluster">
          <a class="button button-primary" href="/contact-us/#quote-form">Get Your Fixed-Price Quote</a>
          <a class="button button-secondary" href="tel:+61433819989">Call 0433 819 989</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="editorial-grid">
      <div class="editorial-copy reveal-on-scroll">
        <div class="section-heading">
          <span class="eyebrow">Local Intelligence</span>
          <h2>Professional route planning for ${escapeHtml(profile.suburb)} moves.</h2>
        </div>
        <p class="lede">${escapeHtml(profile.intro[0])}</p>
        <p>${escapeHtml(profile.intro[1])}</p>
        <p class="field-note" style="margin-top: 2rem;">Local references for this corridor include ${escapeHtml(profile.nearby)}.</p>
      </div>
      <aside class="editorial-panel reveal-on-scroll">
        <h3 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 2rem;">${escapeHtml(startHere.heading)}</h3>
        <div class="editorial-ledger">
${(startHere.points || []).map((point) => `          <div>
            <strong style="color: var(--color-accent);">${escapeHtml(point.split(/\s+/).slice(0, 3).join(' '))}</strong>
            <span style="font-size: 0.9rem; line-height: 1.5;">${escapeHtml(point)}</span>
          </div>`).join('\n')}
        </div>
        ${
          nearbyLinks.length > 0
            ? `<div class="hero-link-stack" style="margin-top: 3rem; border-color: var(--color-border-strong);">
  <p class="hero-link-intro">Compare Nearby Areas</p>
  <div class="inline-link-group" style="color: var(--color-text);">
${nearbyLinks.map(({ href, label }) => (href ? `<a href="${escapeAttribute(href)}" style="color: inherit; font-weight: 600;">${escapeHtml(label)}</a>` : `<span>${escapeHtml(label)}</span>`)).join('\n')}
  </div>
</div>`
            : ''
        }
      </aside>
    </div>
  </div>
</section>

<section class="section section-soft">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">Operational Standards</span>
      <h2>Factors we account for in ${escapeHtml(profile.suburb)}.</h2>
      <p class="lede">Every address has a unique access profile. We review these variables to ensure move-day precision.</p>
    </div>
    <div class="value-grid">
${profile.conditions
  .map((condition) => {
    const conditionHeading = condition.split(/\s+/).slice(0, SUBURB_CONDITION_HEADING_WORDS).join(' ');
    return `<article class="value-card reveal-on-scroll">
  <h3>${escapeHtml(conditionHeading)}</h3>
  <p>${escapeHtml(condition)}</p>
</article>`;
  })
  .join('\n')}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">Move Scenarios</span>
      <h2>Representative situations we manage in ${escapeHtml(profile.suburb)}.</h2>
    </div>
    <div class="timeline-grid">
${profile.scenarios
  .map(
    ({ title, copy }, index) => `<article class="timeline-card reveal-on-scroll">
  <small>Scenario ${String(index + 1).padStart(2, '0')}</small>
  <h3>${escapeHtml(title)}</h3>
  <p>${escapeHtml(copy)}</p>
</article>`,
  )
  .join('\n')}
    </div>
  </div>
</section>

<section class="section section-dark-plan">
  <div class="container">
    <div class="editorial-grid">
      <div class="editorial-copy reveal-on-scroll">
        <div class="section-heading">
          <span class="eyebrow" style="color: white; border-color: rgba(255,255,255,0.3);">Verified Integrity</span>
          <h2 style="color: white;">Why clients choose ZQ for ${escapeHtml(profile.suburb)} relocations.</h2>
        </div>
        <p style="color: rgba(255,255,255,0.8);">${escapeHtml(profile.trust[0])}</p>
        <p style="color: rgba(255,255,255,0.8);">${escapeHtml(profile.trust[1])}</p>
        ${extraParagraph ? extraParagraph.replace('<p>', '<p style="color: rgba(255,255,255,0.8);">') : ''}
        <p style="color: rgba(255,255,255,0.8);">${escapeHtml(targetCopy)}</p>
      </div>
      <div class="editorial-copy reveal-on-scroll">
        <h3 style="color: var(--color-accent); font-family: var(--font-heading); font-size: 1.6rem; margin-bottom: 2rem;">Related Relocation Services</h3>
        <ul aria-label="Service navigation" class="value-card" style="background: transparent; border: 0; box-shadow: none; padding: 0; gap: 1rem;">
          <li style="color: white;"><a href="/house-removals-adelaide/" style="color: inherit; font-weight: 600;">House Removals Adelaide</a></li>
          <li style="color: white;"><a href="/removalists-adelaide/" style="color: inherit; font-weight: 600;">All Suburb Coverage</a></li>
          <li style="color: white;"><a href="/packing-services-adelaide/" style="color: inherit; font-weight: 600;">Packing & Unpacking</a></li>
          <li style="color: white;"><a href="/furniture-removalists-adelaide/" style="color: inherit; font-weight: 600;">Furniture Specialists</a></li>
          <li style="color: white;"><a href="/office-removals-adelaide/" style="color: inherit; font-weight: 600;">Office & Commercial</a></li>
          <li style="color: white;"><a href="/interstate-removals-adelaide/" style="color: inherit; font-weight: 600;">Interstate Logistics</a></li>
          <li style="color: var(--color-accent-strong); margin-top: 1rem;"><a href="/contact-us/#quote-form" style="color: inherit; font-weight: 700; text-decoration: underline;">Get a Fixed-Price Quote</a></li>
        </ul>
      </div>
    </div>
  </div>
</section>

${renderSuburbV4Section(page)}
</main>`;
}

function suburbWordCount(profile) {
  const values = [
    profile.hero || '',
    ...((profile.intro || []).filter(Boolean)),
    ...((profile.conditions || []).filter(Boolean)),
    ...((profile.scenarios || []).flatMap(({ title, copy }) => [title || '', copy || ''])),
    ...((profile.trust || []).filter(Boolean)),
    profile.services || '',
    profile.nearby || '',
  ];

  return values.reduce((count, value) => count + value.split(/\s+/).filter(Boolean).length, 0);
}

function sanitizePublicCopy(content) {
  return content
    .replaceAll(
      'and the nearby routes are named explicitly here.',
      'and the nearby areas we commonly cover.',
    )
    .replaceAll(
      'should stay visible in the page copy and schema.',
      'are nearby areas we commonly cover.',
    )
    .replaceAll(
      'belong in the content and schema.',
      'are nearby areas we commonly cover.',
    )
    .replaceAll(
      'are the route names that help the page match the way people actually search.',
      'are nearby areas people often mention when planning the move.',
    );
}

function renderAuthoritySection(page) {
  const output = page.output;
  if (output === 'index.html' || output === 'contact-us/index.html' || output === '404.html' || output === 'thank-you.html') {
    return '';
  }

  const sectionId = `${output.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-authority`;

  return `
<section aria-labelledby="${sectionId}" class="section section-dark-plan">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">Move Planning Authority</span>
      <h2 id="${sectionId}">Deliberate logistics for high-trust relocations.</h2>
      <p class="lede">We review every move brief manually to eliminate variables before the truck arrives. Here is our operational standard.</p>
    </div>
    <div class="proof-grid">
      <article class="proof-card reveal-on-scroll">
        <span class="proof-label">Route & Access</span>
        <h3>Common access issues we account for</h3>
        <p>We check for lift bookings, loading docks, long carries, and parking restrictions to ensure our trucks and crew are properly equipped for your specific property.</p>
      </article>
      <article class="proof-card reveal-on-scroll">
        <span class="proof-label">Pricing Integrity</span>
        <h3>The logic behind your quote</h3>
        <p>Your fixed-price quote is based on a professional review of your inventory volume and the actual time required to navigate your pickup and delivery locations.</p>
      </article>
      <article class="proof-card reveal-on-scroll">
        <span class="proof-label">Fixed-Price Value</span>
        <h3>Why fixed pricing protects you</h3>
        <p>Hourly rates reward slow work. Our fixed-price model guarantees your move cost upfront, providing total certainty regardless of traffic or unexpected route delays.</p>
      </article>
      <article class="proof-card reveal-on-scroll">
        <span class="proof-label">Accountability</span>
        <h3>What happens after enquiry</h3>
        <p>Our Adelaide team reviews your details and replies with a confirmed quote and clear logistics plan, usually within a few hours of receiving your brief.</p>
      </article>
    </div>
  </div>
</section>`;
}

function renderRelatedLinksSection(page) {
  const profile = getRelatedLinksProfile(page);
  if (!profile) {
    return '';
  }

  const sectionId = `${page.output.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-related-links`;
  const cards = profile.links
    .map(
      ({ eyebrow, title, copy, url, cta }) => `<article class="route-card reveal-on-scroll">
  <small>${escapeHtml(eyebrow)}</small>
  <h3>${escapeHtml(title)}</h3>
  <p>${escapeHtml(copy)}</p>
  <footer>
    <a class="button-link" href="${escapeAttribute(url)}">${escapeHtml(cta)}</a>
  </footer>
</article>`,
    )
    .join('\n');

  return `
<section aria-labelledby="${sectionId}" class="section section-soft">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">${escapeHtml(profile.eyebrow)}</span>
      <h2 id="${sectionId}">${escapeHtml(profile.heading)}</h2>
      <p>${escapeHtml(profile.intro)}</p>
    </div>
    <div class="route-grid">
${cards}
    </div>
  </div>
</section>`;
}

function getRelatedLinksProfile(page) {
  const output = page.output;

  if (output === 'index.html' || output === 'contact-us/index.html' || output === '404.html') {
    return null;
  }

  if (output === 'removalists-adelaide/index.html') {
    return {
      eyebrow: 'Adelaide cluster links',
      heading: 'Use the Adelaide hub to move deeper into the right cluster.',
      intro:
        'Start with the corridor hub, the service page, or the planning guide that best matches the route before you request the final quote.',
      links: [
        {
          eyebrow: 'North corridor',
          title: 'Northern Adelaide removals',
          copy: 'Use the northern hub for Mawson Lakes apartments, Salisbury family-home routes, and wider northside planning.',
          url: '/removalists-northern-adelaide/',
          cta: 'View northern Adelaide',
        },
        {
          eyebrow: 'South corridor',
          title: 'Southern Adelaide removals',
          copy: 'Use the southern hub for coastal suburbs, family homes, storage-linked routes, and interstate-ready southbound planning.',
          url: '/removalists-southern-adelaide/',
          cta: 'View southern Adelaide',
        },
        {
          eyebrow: 'House moves',
          title: 'House removals Adelaide',
          copy: 'Start with the residential service page for family homes, apartments, and townhouse moves across Adelaide.',
          url: '/house-removals-adelaide/',
          cta: 'View house removals',
        },
        {
          eyebrow: 'Packing',
          title: 'Packing services Adelaide',
          copy: 'Add packing help for fragile items, kitchens, wardrobes, or full-home preparation.',
          url: '/packing-services-adelaide/',
          cta: 'View packing services',
        },
        {
          eyebrow: 'Furniture',
          title: 'Furniture removals',
          copy: 'For bulky, delicate, or hard-to-move pieces that need extra care and access planning.',
          url: '/furniture-removalists-adelaide/',
          cta: 'View furniture removals',
        },
        {
          eyebrow: 'Office',
          title: 'Office relocations',
          copy: 'For desks, equipment, files, and workspaces that need a commercial move plan.',
          url: '/office-removals-adelaide/',
          cta: 'View office removals',
        },
        {
          eyebrow: 'Guide hub',
          title: 'Adelaide moving guides',
          copy: 'Use the guide hub when the move is still being shaped by pricing, access, packing, or timing questions.',
          url: '/adelaide-moving-guides/',
          cta: 'Open the guide hub',
        },
        {
          eyebrow: 'Apartment access',
          title: 'Apartment lift bookings Adelaide',
          copy: 'Read this guide when booked lifts, loading docks, and tower access affect the timing more than the suburb alone.',
          url: '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
          cta: 'Read the apartment-lift guide',
        },
        {
          eyebrow: 'Coastal access',
          title: 'Coastal moving access Adelaide',
          copy: 'Use the coastal guide when frontage, stairs, and beachside parking pressure are part of the move brief.',
          url: '/adelaide-moving-guides/coastal-moving-access-adelaide/',
          cta: 'Read the coastal-access guide',
        },
        {
          eyebrow: 'Quote',
          title: 'Request a fixed-price quote',
          copy: 'Send the addresses, property type, and access notes for a clear Adelaide move quote.',
          url: '/contact-us/#quote-form',
          cta: 'Request a quote',
        },
      ],
    };
  }

  if (output === 'removalists-northern-adelaide/index.html') {
    return {
      eyebrow: 'Northern cluster links',
      heading: 'Use the northside hub to move from corridor research into the right page.',
      intro:
        'Choose the suburb page, service page, or planning guide that matches the route once the access pattern and inventory are clearer.',
      links: [
        {
          eyebrow: 'Apartment suburb',
          title: 'Removalists Mawson Lakes',
          copy: 'Use the Mawson Lakes page for apartments, shared building access, and more controlled mixed-use routes.',
          url: '/removalists-mawson-lakes/',
          cta: 'View Mawson Lakes',
        },
        {
          eyebrow: 'Family-home suburb',
          title: 'Removalists Salisbury',
          copy: 'Use Salisbury for family homes, storage-linked moves, and broader northern corridor staging.',
          url: '/removalists-salisbury/',
          cta: 'View Salisbury',
        },
        {
          eyebrow: 'Commercial service',
          title: 'Office removals Adelaide',
          copy: 'Open the office page when desks, files, monitors, or a clinic-style move sit inside the northside route.',
          url: '/office-removals-adelaide/',
          cta: 'View office removals',
        },
        {
          eyebrow: 'Packing support',
          title: 'Packing services Adelaide',
          copy: 'Use packing support when the northside move includes fragile rooms, tighter access, or a compressed handover.',
          url: '/packing-services-adelaide/',
          cta: 'View packing services',
        },
        {
          eyebrow: 'Apartment guide',
          title: 'Apartment lift bookings Adelaide',
          copy: 'Read the guide before tower or apartment jobs where booked lifts and loading windows control the whole move.',
          url: '/adelaide-moving-guides/apartment-lift-bookings-adelaide/',
          cta: 'Read the apartment-lift guide',
        },
        {
          eyebrow: 'Office guide',
          title: 'Office relocation checklist Adelaide',
          copy: 'Use the office checklist when the move needs downtime control, team restart sequencing, or building-access planning.',
          url: '/adelaide-moving-guides/office-relocation-checklist-adelaide/',
          cta: 'Read the office checklist',
        },
      ],
    };
  }

  if (output === 'removalists-southern-adelaide/index.html') {
    return {
      eyebrow: 'Southern cluster links',
      heading: 'Use the southern hub to move from corridor intent into the best-fit page.',
      intro:
        'Choose the suburb page, service page, or guide that matches whether the route is coastal, family-home led, packing heavy, or interstate-ready.',
      links: [
        {
          eyebrow: 'Coastal suburb',
          title: 'Removalists Noarlunga',
          copy: 'Use Noarlunga for coastal access, storage transitions, and southern corridor staging near beachside and mixed-use routes.',
          url: '/removalists-noarlunga/',
          cta: 'View Noarlunga',
        },
        {
          eyebrow: 'Junction suburb',
          title: 'Removalists Reynella',
          copy: 'Use Reynella for fuller family-home loads, split-level access, and southern routes that may feed into interstate departures.',
          url: '/removalists-reynella/',
          cta: 'View Reynella',
        },
        {
          eyebrow: 'Residential service',
          title: 'House removals Adelaide',
          copy: 'Open the house page when the southern route is mainly a household move with room-by-room planning and heavier inventory.',
          url: '/house-removals-adelaide/',
          cta: 'View house removals',
        },
        {
          eyebrow: 'Interstate service',
          title: 'Interstate removals Adelaide',
          copy: 'Use the interstate page when the southern pickup becomes the Adelaide leg of a longer route out of South Australia.',
          url: '/interstate-removals-adelaide/',
          cta: 'View interstate removals',
        },
        {
          eyebrow: 'Coastal guide',
          title: 'Coastal moving access Adelaide',
          copy: 'Read the guide before beachside, frontage-sensitive, or parking-heavy routes where access detail changes the labour plan.',
          url: '/adelaide-moving-guides/coastal-moving-access-adelaide/',
          cta: 'Read the coastal-access guide',
        },
        {
          eyebrow: 'Packing guide',
          title: 'When to book packing services Adelaide',
          copy: 'Use the packing-planning guide when fragile rooms, timing pressure, or a longer southern route make self-packing risky.',
          url: '/adelaide-moving-guides/when-to-book-packing-services-adelaide/',
          cta: 'Read the packing guide',
        },
      ],
    };
  }

  if (output === 'house-removals-adelaide/index.html') {
    return {
      eyebrow: 'Residential planning links',
      heading: 'Use the house-move page to branch into the right residential intent.',
      intro:
        'Some Adelaide house-move searches are really about apartment access, storage staging, or urgent booking windows. Use the page that matches the brief before requesting the quote.',
      links: [
        {
          eyebrow: 'Budget-led moves',
          title: 'Cheap removalists Adelaide',
          copy: 'Use the affordable-moves page when pricing clarity and leaner scope control are the main buying factors.',
          url: '/cheap-removalists-adelaide/',
          cta: 'View affordable removals',
        },
        {
          eyebrow: 'Apartment access',
          title: 'Apartment removalists Adelaide',
          copy: 'Use the apartment page when lifts, stairs, shared corridors, and booked loading windows drive the move more than the suburb alone.',
          url: '/apartment-removalists-adelaide/',
          cta: 'View apartment removals',
        },
        {
          eyebrow: 'Storage staging',
          title: 'Storage-friendly removals Adelaide',
          copy: 'Use the storage page when the route needs a staged delivery, renovation gap, or temporary hold between addresses.',
          url: '/storage-friendly-removals-adelaide/',
          cta: 'View storage-friendly removals',
        },
        {
          eyebrow: 'Short notice',
          title: 'Same-day removalists Adelaide',
          copy: 'Use the urgent-move page when the booking window is tight and the access brief needs a faster decision.',
          url: '/same-day-removalists-adelaide/',
          cta: 'View same-day removals',
        },
        {
          eyebrow: 'Planning guide',
          title: 'Moving checklist Adelaide',
          copy: 'Open the checklist guide when the house move still needs room-by-room planning and a cleaner booking brief.',
          url: '/adelaide-moving-guides/moving-checklist-adelaide/',
          cta: 'Open the checklist guide',
        },
        {
          eyebrow: 'Planning guide',
          title: 'Removalist cost Adelaide',
          copy: 'Use the pricing guide when the household brief needs better cost framing before the quote is requested.',
          url: '/adelaide-moving-guides/removalist-cost-adelaide/',
          cta: 'Open the cost guide',
        },
      ],
    };
  }

  if (
    output === 'interstate-removals-adelaide/index.html' ||
    output === 'adelaide-to-melbourne-removals/index.html' ||
    output === 'adelaide-to-sydney-removals/index.html' ||
    output === 'adelaide-to-brisbane-removals/index.html' ||
    output === 'adelaide-to-canberra-removals/index.html' ||
    output === 'adelaide-to-perth-removals/index.html' ||
    output === 'adelaide-to-queensland-removals/index.html'
  ) {
    const routeLinks =
      output === 'interstate-removals-adelaide/index.html'
        ? [
            {
              eyebrow: 'Route page',
              title: 'Adelaide to Melbourne removals',
              copy: 'See the Melbourne route page for destination-specific planning and quote context.',
              url: '/adelaide-to-melbourne-removals/',
              cta: 'View Adelaide to Melbourne',
            },
            {
              eyebrow: 'Route page',
              title: 'Adelaide to Sydney removals',
              copy: 'See the Sydney route page for longer-haul timing, access, and packing considerations.',
              url: '/adelaide-to-sydney-removals/',
              cta: 'View Adelaide to Sydney',
            },
            {
              eyebrow: 'Route page',
              title: 'Adelaide to Brisbane removals',
              copy: 'Review the Brisbane route page if Queensland is the destination and the quote needs route-specific planning.',
              url: '/adelaide-to-brisbane-removals/',
              cta: 'View Adelaide to Brisbane',
            },
            {
              eyebrow: 'Route page',
              title: 'Adelaide to Canberra removals',
              copy: 'Check the Canberra route page for longer interstate timing and delivery access details.',
              url: '/adelaide-to-canberra-removals/',
              cta: 'View Adelaide to Canberra',
            },
            {
              eyebrow: 'Route page',
              title: 'Adelaide to Perth removals',
              copy: 'Use the Perth route page when the move needs a western route brief and stronger packing control.',
              url: '/adelaide-to-perth-removals/',
              cta: 'View Adelaide to Perth',
            },
            {
              eyebrow: 'Route page',
              title: 'Adelaide to Queensland removals',
              copy: 'Use the Queensland route page for broader long-distance planning beyond Brisbane alone.',
              url: '/adelaide-to-queensland-removals/',
              cta: 'View Adelaide to Queensland',
            },
            {
              eyebrow: 'Packing',
              title: 'Packing services Adelaide',
              copy: 'Add packing support for fragile items, longer travel, or tighter delivery windows.',
              url: '/packing-services-adelaide/',
              cta: 'View packing services',
            },
            {
              eyebrow: 'Quote',
              title: 'Request a fixed-price quote',
              copy: 'Send both addresses, access details, and any packing needs for a route-specific quote.',
              url: '/contact-us/#quote-form',
              cta: 'Request a quote',
            },
          ]
        : [
            {
              eyebrow: 'Interstate hub',
              title: 'Interstate removals Adelaide',
              copy: 'See the Adelaide interstate service page for route planning and broader destination coverage.',
              url: '/interstate-removals-adelaide/',
              cta: 'Open interstate removals',
            },
            {
              eyebrow: 'Packing',
              title: 'Packing services Adelaide',
              copy: 'Add packing support for fragile items, longer travel, or tighter delivery windows.',
              url: '/packing-services-adelaide/',
              cta: 'View packing services',
            },
            {
              eyebrow: 'Local pickup',
              title: 'Adelaide local removals',
              copy: 'If the move starts with a local Adelaide leg, review the local removals hub as well.',
              url: '/removalists-adelaide/',
              cta: 'View local removals',
            },
            {
              eyebrow: 'Quote',
              title: 'Request a fixed-price quote',
              copy: 'Send both addresses, access details, and any packing needs for a route-specific quote.',
              url: '/contact-us/#quote-form',
              cta: 'Request a quote',
            },
          ];

    return {
      eyebrow: 'Related services',
      heading: 'Useful links while planning an interstate move.',
      intro:
        'Use the interstate hub for route planning, add packing support when needed, or request a fixed-price quote once the addresses are ready.',
      links: routeLinks,
    };
  }

  if (
    output === 'office-removals-adelaide/index.html' ||
    output === 'furniture-removalists-adelaide/index.html' ||
    output === 'packing-services-adelaide/index.html'
  ) {
    const serviceLinks =
      output === 'office-removals-adelaide/index.html'
        ? [
            {
              eyebrow: 'Residential',
              title: 'House removals Adelaide',
              copy: 'Use the house removals page for family homes, apartments, and townhouse moves across Adelaide.',
              url: '/house-removals-adelaide/',
              cta: 'View house removals',
            },
            {
              eyebrow: 'Adelaide CBD',
              title: 'Removalists Adelaide CBD',
              copy: 'Use the CBD page when the office move depends on loading zones, service lifts, or tighter city access windows.',
              url: '/removalists-adelaide-cbd/',
              cta: 'View Adelaide CBD moves',
            },
            {
              eyebrow: 'Marion',
              title: 'Removalists Marion',
              copy: 'Use the Marion page for south-west business moves, clinics, and mixed residential-commercial routes.',
              url: '/removalists-marion/',
              cta: 'View Marion moves',
            },
            {
              eyebrow: 'Packing',
              title: 'Packing services Adelaide',
              copy: 'Add packing help for files, workstations, fragile items, and move-day preparation.',
              url: '/packing-services-adelaide/',
              cta: 'View packing services',
            },
            {
              eyebrow: 'Interstate',
              title: 'Interstate removals Adelaide',
              copy: 'Use the interstate hub if the office move includes another city or a staged interstate route.',
              url: '/interstate-removals-adelaide/',
              cta: 'View interstate removals',
            },
            {
              eyebrow: 'Quote',
              title: 'Request a fixed-price quote',
              copy: 'Send the move details once and get a quote that matches the actual job.',
              url: '/contact-us/#quote-form',
              cta: 'Request a quote',
            },
          ]
          : output === 'furniture-removalists-adelaide/index.html'
          ? [
              {
                eyebrow: 'Residential',
                title: 'House removals Adelaide',
                copy: 'Use the house removals page when the furniture brief sits inside a wider residential move.',
                url: '/house-removals-adelaide/',
                cta: 'View house removals',
              },
              {
                eyebrow: 'Packing',
                title: 'Packing services Adelaide',
                copy: 'Add wrapping and packing help for fragile items, artwork, kitchens, or full-home preparation.',
                url: '/packing-services-adelaide/',
                cta: 'View packing services',
              },
              {
                eyebrow: 'Glenelg',
                title: 'Removalists Glenelg',
                copy: 'Use the Glenelg page for coastal apartments, fragile furniture, and beachside access planning.',
                url: '/removalists-glenelg/',
                cta: 'View Glenelg moves',
              },
              {
                eyebrow: 'Interstate',
                title: 'Interstate removals Adelaide',
                copy: 'Use the interstate hub if the furniture is travelling beyond Adelaide.',
                url: '/interstate-removals-adelaide/',
                cta: 'View interstate removals',
              },
              {
                eyebrow: 'Quote',
                title: 'Request a fixed-price quote',
                copy: 'Send the move details once and get a quote that matches the actual job.',
                url: '/contact-us/#quote-form',
                cta: 'Request a quote',
              },
            ]
          : [
              {
                eyebrow: 'Residential',
                title: 'House removals Adelaide',
                copy: 'Use the house removals page if the packing brief supports a wider home, apartment, or townhouse move.',
                url: '/house-removals-adelaide/',
                cta: 'View house removals',
              },
              {
                eyebrow: 'Interstate',
                title: 'Interstate removals Adelaide',
                copy: 'Use the interstate hub if the move is leaving Adelaide or needs a longer delivery plan.',
                url: '/interstate-removals-adelaide/',
                cta: 'View interstate removals',
              },
              {
                eyebrow: 'Furniture',
                title: 'Furniture removals',
                copy: 'See the furniture service page for bulky, delicate, and hard-to-move pieces.',
                url: '/furniture-removalists-adelaide/',
                cta: 'View furniture removals',
              },
              {
                eyebrow: 'Quote',
                title: 'Request a fixed-price quote',
                copy: 'Send the move details once and get a quote that matches the actual job.',
                url: '/contact-us/#quote-form',
                cta: 'Request a quote',
              },
            ];

    return {
      eyebrow: 'Related services',
      heading: 'Plan the move around the right support.',
      intro:
        'Combine the main service with local removals, interstate planning, or packing support depending on what the job needs.',
      links: serviceLinks,
    };
  }

  if (output.startsWith('removalists-')) {
    const suburbLinks = getSuburbLinkProfile(getSuburbSlugFromPage(page));
    const peerLinks = (suburbLinks?.peers || []).slice(0, 2).map((item) => ({
      eyebrow: 'Nearby suburb',
      title: item.suburb || item.label,
      copy: `Use ${item.suburb || item.label} when the route, access pattern, or suburb comparison is a better fit than this page alone.`,
      url: item.href,
      cta: item.label,
    }));

    return {
      eyebrow: 'Plan the full move',
      heading: 'Useful links for the rest of the move.',
      intro:
        'Use the Adelaide local removals page for broader suburb coverage, add support for delicate items or packing, or request a fixed-price quote when the brief is ready.',
      links: [
        ...peerLinks,
        {
          eyebrow: 'Residential',
          title: 'House removals Adelaide',
          copy: 'See the residential service page for family homes, apartments, and townhouse moves across Adelaide.',
          url: '/house-removals-adelaide/',
          cta: 'Open house removals',
        },
        {
          eyebrow: 'Furniture',
          title: 'Furniture removals',
          copy: 'For bulky, delicate, or hard-to-move pieces that need extra care and access planning.',
          url: '/furniture-removalists-adelaide/',
          cta: 'View furniture removals',
        },
        {
          eyebrow: 'Office',
          title: 'Office relocations Adelaide',
          copy: 'Use the office relocations page when the brief includes clinics, workstations, files, or mixed-use business inventory.',
          url: '/office-removals-adelaide/',
          cta: 'View office relocations',
        },
        {
          eyebrow: 'Packing',
          title: 'Packing services Adelaide',
          copy: 'Add packing support for fragile items, kitchens, wardrobes, or full-home preparation.',
          url: '/packing-services-adelaide/',
          cta: 'View packing services',
        },
        {
          eyebrow: 'Interstate',
          title: 'Interstate removals Adelaide',
          copy: 'Use the interstate hub if the suburb move also includes a longer route beyond Adelaide.',
          url: '/interstate-removals-adelaide/',
          cta: 'View interstate removals',
        },
        {
          eyebrow: 'Quote',
          title: 'Request a fixed-price quote',
          copy: 'Send the addresses, property type, and access notes for a clear quote.',
          url: '/contact-us/#quote-form',
          cta: 'Request a quote',
        },
      ],
    };
  }

  if (output === 'adelaide-moving-guides/index.html' || output.startsWith('adelaide-moving-guides/')) {
    if (output === 'adelaide-moving-guides/index.html') {
      return {
        eyebrow: 'Planning clusters',
        heading: 'Use the guide hub to move from research into the right booking page.',
        intro:
          'These guide pages answer real pre-quote questions, then hand off into the commercial page or service page that matches the move brief.',
        links: [
          {
            eyebrow: 'Checklist',
            title: 'Moving checklist Adelaide',
            copy: 'Use the checklist when the move needs a clear pre-booking sequence before the quote is locked in.',
            url: '/adelaide-moving-guides/moving-checklist-adelaide/',
            cta: 'Read the moving checklist',
          },
          {
            eyebrow: 'Pricing',
            title: 'Removalist cost Adelaide',
            copy: 'Use the pricing guide when the next step is understanding labour, access, and timing pressure before comparing quotes.',
            url: '/adelaide-moving-guides/removalist-cost-adelaide/',
            cta: 'Read the cost guide',
          },
          {
            eyebrow: 'Apartment',
            title: 'Apartment moving tips Adelaide',
            copy: 'Use the apartment guide when shared access, lift bookings, or corridor rules are likely to control the whole move.',
            url: '/adelaide-moving-guides/apartment-moving-tips-adelaide/',
            cta: 'Read the apartment guide',
          },
          {
            eyebrow: 'Office',
            title: 'Office relocation preparation Adelaide',
            copy: 'Use the office prep guide when the move involves downtime control, dock access, and a staged restart.',
            url: '/adelaide-moving-guides/office-relocation-preparation-adelaide/',
            cta: 'Read the office guide',
          },
          {
            eyebrow: 'Urgent moves',
            title: 'Same-day removalists Adelaide',
            copy: 'Switch to the same-day page when the planning question is really about confirming a fast booking window.',
            url: '/same-day-removalists-adelaide/',
            cta: 'View same-day removals',
          },
          {
            eyebrow: 'Budget moves',
            title: 'Cheap removalists Adelaide',
            copy: 'Switch to the affordable-moves page when the planning question is really about keeping the job lean and clearly scoped.',
            url: '/cheap-removalists-adelaide/',
            cta: 'View affordable removals',
          },
        ],
      };
    }

    if (output === 'adelaide-moving-guides/apartment-lift-bookings-adelaide/index.html') {
      return {
        eyebrow: 'Related services',
        heading: 'Use these pages when apartment access starts controlling the whole move.',
        intro:
          'Apartment lift planning is most useful when it sits next to the service page, suburb page, and packing support that match the route.',
        links: [
          {
            eyebrow: 'Residential service',
            title: 'House removals Adelaide',
            copy: 'Use the house service page when the apartment move sits inside a wider household brief.',
            url: '/house-removals-adelaide/',
            cta: 'View house removals',
          },
          {
            eyebrow: 'CBD suburb',
            title: 'Removalists Adelaide CBD',
            copy: 'Use the CBD page for towers, booked docks, concierge rules, and tighter city apartment windows.',
            url: '/removalists-adelaide-cbd/',
            cta: 'View Adelaide CBD',
          },
          {
            eyebrow: 'North corridor suburb',
            title: 'Removalists Mawson Lakes',
            copy: 'Use Mawson Lakes when apartment buildings and controlled access in the north shape the quote.',
            url: '/removalists-mawson-lakes/',
            cta: 'View Mawson Lakes',
          },
          {
            eyebrow: 'Packing support',
            title: 'Packing services Adelaide',
            copy: 'Add packing support when tighter corridors and stacked loads make carton quality more important.',
            url: '/packing-services-adelaide/',
            cta: 'View packing services',
          },
        ],
      };
    }

    if (output === 'adelaide-moving-guides/coastal-moving-access-adelaide/index.html') {
      return {
        eyebrow: 'Related services',
        heading: 'Use these pages when coastal access is shaping the move brief.',
        intro:
          'Coastal access questions usually lead into the residential service page, the furniture page, and the suburb hubs where parking and frontage matter most.',
        links: [
          {
            eyebrow: 'Residential service',
            title: 'House removals Adelaide',
            copy: 'Use the house page when coastal access sits inside a wider household move with multiple rooms and heavier inventory.',
            url: '/house-removals-adelaide/',
            cta: 'View house removals',
          },
          {
            eyebrow: 'Furniture service',
            title: 'Furniture removals Adelaide',
            copy: 'Use the furniture page when beachside stairs, awkward entries, or delicate pieces need their own handling plan.',
            url: '/furniture-removalists-adelaide/',
            cta: 'View furniture removals',
          },
          {
            eyebrow: 'Coastal suburb',
            title: 'Removalists Glenelg',
            copy: 'Open Glenelg for coastal apartments, shared entries, and parking-sensitive beachfront routes closer to the city.',
            url: '/removalists-glenelg/',
            cta: 'View Glenelg',
          },
          {
            eyebrow: 'Southern coastal suburb',
            title: 'Removalists Noarlunga',
            copy: 'Open Noarlunga for southern coastal access, storage-linked routes, and broader southbound staging.',
            url: '/removalists-noarlunga/',
            cta: 'View Noarlunga',
          },
          {
            eyebrow: 'South corridor hub',
            title: 'Southern Adelaide removals',
            copy: 'Use the southern hub when the beachside route is part of a broader southern-corridor move brief.',
            url: '/removalists-southern-adelaide/',
            cta: 'View southern Adelaide',
          },
        ],
      };
    }

    return {
      eyebrow: 'Turn planning into a quote',
      heading: 'Ready to book the move?',
      intro:
        'Use the service page that matches the move, then send the details for a fixed-price quote once the brief is clear.',
      links: [
        {
          eyebrow: 'Local removals',
          title: 'Adelaide local removals',
          copy: 'For suburb-to-suburb moves, apartments, family homes, and Adelaide local relocations.',
          url: '/removalists-adelaide/',
          cta: 'View local removals',
        },
        {
          eyebrow: 'Interstate',
          title: 'Interstate removals Adelaide',
          copy: 'For routes leaving Adelaide, including Melbourne, Sydney, and other interstate destinations.',
          url: '/interstate-removals-adelaide/',
          cta: 'View interstate removals',
        },
        {
          eyebrow: 'Office',
          title: 'Office removals Adelaide',
          copy: 'For offices, clinics, studios, and workspaces that need access and restart planning.',
          url: '/office-removals-adelaide/',
          cta: 'View office removals',
        },
        {
          eyebrow: 'Furniture',
          title: 'Furniture removals Adelaide',
          copy: 'Use the furniture page when the job is led by bulky, delicate, or single-item handling.',
          url: '/furniture-removalists-adelaide/',
          cta: 'View furniture removals',
        },
        {
          eyebrow: 'Packing',
          title: 'Packing services Adelaide',
          copy: 'Use the packing page when the move needs wrapping, carton sequencing, or fragile-item preparation.',
          url: '/packing-services-adelaide/',
          cta: 'View packing services',
        },
        {
          eyebrow: 'Quote',
          title: 'Request a fixed-price quote',
          copy: 'Send the addresses, property type, and access notes when you are ready for pricing.',
          url: '/contact-us/#quote-form',
          cta: 'Request a quote',
        },
      ],
    };
  }

  return null;
}

function renderFaqSection(page, content) {
  const profile = faqProfiles[page.output];
  if (!profile || content.includes('class="faq-list"')) {
    return '';
  }

  const sectionId = `${page.output.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-faq`;
  const items = profile.items
    .map(
      ({ question, answer }) => `<article class="faq-item reveal-on-scroll">
  <h3 class="faq-question">${escapeHtml(question)}</h3>
  <div class="faq-answer">
    <p>${escapeHtml(answer)}</p>
  </div>
</article>`,
    )
    .join('\n');

  return `
<section aria-labelledby="${sectionId}" class="section">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">${escapeHtml(profile.eyebrow)}</span>
      <h2 id="${sectionId}">${escapeHtml(profile.heading)}</h2>
      <p class="lede">${escapeHtml(profile.intro)}</p>
    </div>
    <div class="faq-list faq-list-premium">
${items}
    </div>
  </div>
</section>`;
}

function renderLocalProofSection(page) {
  const profile = localProofProfiles[page.output];
  if (!profile) {
    return '';
  }

  const sectionId = `${page.output.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-local-proof`;
  const cards = profile.cards
    .map(
      ({ title, copy, points }) => `<article class="value-card reveal-on-scroll">
  <h3>${escapeHtml(title)}</h3>
  <p>${escapeHtml(copy)}</p>
  <ul>
${points.map((point) => `    <li>${escapeHtml(point)}</li>`).join('\n')}
  </ul>
</article>`,
    )
    .join('\n');

  return `
<section aria-labelledby="${sectionId}" class="section section-soft">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">${escapeHtml(profile.eyebrow)}</span>
      <h2 id="${sectionId}">${escapeHtml(profile.heading)}</h2>
      <p class="lede">${escapeHtml(profile.intro)}</p>
    </div>
    <div class="value-grid">
${cards}
    </div>
  </div>
</section>`;
}

function renderSeoSupportSection(page) {
  const profile = seoSupportProfiles[page.output];
  if (!profile) {
    return '';
  }

  const sectionId = `${page.output.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-seo-guides`;
  const cards = profile.cards
    .map(({ guide, description }) => {
      const meta = seoGuideLibrary[guide];
      if (!meta) {
        return '';
      }

      return `<article class="route-card reveal-on-scroll">
  <small>Move Planning</small>
  <h3>${escapeHtml(meta.title)}</h3>
  <p>${escapeHtml(description)}</p>
  <footer>
    <a class="button-link" href="${escapeAttribute(meta.url)}">${escapeHtml(meta.cta)}</a>
  </footer>
</article>`;
    })
    .filter(Boolean)
    .join('\n');

  const supportLinks = (profile.supportLinks || [])
    .map(
      ({ url, label }) =>
        `<a href="${escapeAttribute(url)}">${escapeHtml(label)}</a>`,
    )
    .join('\n');

  return `
<section aria-labelledby="${sectionId}" class="section section-soft">
  <div class="container">
    <div class="section-heading reveal-on-scroll">
      <span class="eyebrow">${escapeHtml(profile.eyebrow)}</span>
      <h2 id="${sectionId}">${escapeHtml(profile.heading)}</h2>
      <p class="lede">${escapeHtml(profile.intro)}</p>
    </div>
    <div class="route-grid">
${cards}
    </div>
${
  supportLinks
    ? `<div class="hero-link-stack reveal-on-scroll" style="margin-top: var(--space-6); border-color: var(--color-border-strong);">
  <p class="hero-link-intro">Supporting Resources</p>
  <div class="inline-link-group" style="color: var(--color-text);">
${supportLinks}
  </div>
</div>`
    : ''
}
  </div>
</section>`;
}

function indent(text, spaces) {
  if (!text) {
    return '';
  }

  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? `${prefix}${line}` : line))
    .join('\n');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value).replaceAll('"', '&quot;');
}

function renderBodyTop(page) {
  if (page.layout === 'redirect' || !gtmId) {
    return '';
  }

  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

async function copyStaticAssets() {
  const fileAssets = [
    'analytics.mjs',
    'brand-logo.png',
    'brand-logo-64.webp',
    'brand-logo-256.webp',
    'brand-logo-96.webp',
    'brand-logo.webp',
    'favicon.ico',
    'favicon.svg',
    'llms.txt',
    'ai.txt',
    'robots.txt',
    'screen.png',
    'screen.webp',
    'site.js',
    'zq-removals-social-share.png',
    'zq-removals-social-share.webp',
  ];

  for (const asset of fileAssets) {
    await copyFile(path.join(projectRoot, asset), path.join(distRoot, asset));
  }

  await cp(path.join(projectRoot, 'fonts'), path.join(distRoot, 'fonts'), { recursive: true });
  // Skip raw PNG source files — every PNG in /media/ has a WebP counterpart.
  await cp(path.join(projectRoot, 'media'), path.join(distRoot, 'media'), {
    recursive: true,
    filter: (src) => !src.toLowerCase().endsWith('.png'),
  });
}

async function renderSitemaps(pages, renderedHtmlByOutput = new Map()) {
  const grouped = {
    'sitemap-pages.xml': [],
    'sitemap-services.xml': [],
    'sitemap-suburbs.xml': [],
    'sitemap-guides.xml': [],
    'sitemap-images.xml': [],
  };
  const sitemapLastmods = Object.fromEntries(Object.keys(grouped).map((name) => [name, []]));

  for (const page of pages) {
    if (!shouldIncludeInSitemap(page)) continue;
    const lastmod = await getPageLastmod(page);
    const entry = `  <url>
    <loc>${escapeHtml(page.canonical)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;

    if (page.output.startsWith('adelaide-moving-guides/') || page.output.startsWith('guides/')) {
      grouped['sitemap-guides.xml'].push(entry);
      sitemapLastmods['sitemap-guides.xml'].push(lastmod);
    } else if (page.output.startsWith('removalists-')) {
      grouped['sitemap-suburbs.xml'].push(entry);
      sitemapLastmods['sitemap-suburbs.xml'].push(lastmod);
    } else if (
      page.output === 'house-removals-adelaide/index.html' ||
      page.output === 'office-removals-adelaide/index.html' ||
      page.output === 'packing-services-adelaide/index.html' ||
      page.output === 'furniture-removalists-adelaide/index.html' ||
      page.output === 'interstate-removals-adelaide/index.html' ||
      page.output === 'adelaide-to-melbourne-removals/index.html' ||
      page.output === 'adelaide-to-sydney-removals/index.html' ||
      page.output === 'adelaide-to-brisbane-removals/index.html' ||
      page.output === 'adelaide-to-canberra-removals/index.html' ||
      page.output === 'adelaide-to-perth-removals/index.html' ||
      page.output === 'adelaide-to-queensland-removals/index.html' ||
      page.output === 'fixed-price-removalists-adelaide/index.html' ||
      page.output === 'cheap-vs-fixed-price-removalists-adelaide/index.html' ||
      page.output === 'last-minute-movers-adelaide/index.html' ||
      page.output.startsWith('services/')
    ) {
      grouped['sitemap-services.xml'].push(entry);
      sitemapLastmods['sitemap-services.xml'].push(lastmod);
    } else if (page.output.startsWith('cheap-removalists-adelaide/') || page.output.startsWith('same-day-removalists-adelaide/') || page.output.startsWith('last-minute-removalists-adelaide/') || page.output.startsWith('apartment-removalists-adelaide/') || page.output.startsWith('office-relocation-adelaide/') || page.output.startsWith('storage-friendly-removals-adelaide/') || page.output.startsWith('fixed-price-removalists-adelaide/') || page.output.startsWith('cheap-vs-fixed-price-removalists-adelaide/') || page.output.startsWith('last-minute-movers-adelaide/')) {
      grouped['sitemap-services.xml'].push(entry);
      sitemapLastmods['sitemap-services.xml'].push(lastmod);
    } else {
      grouped['sitemap-pages.xml'].push(entry);
      sitemapLastmods['sitemap-pages.xml'].push(lastmod);
    }

    const imageEntry = await buildImageSitemapEntry(
      page,
      renderedHtmlByOutput.get(page.output.replace(/\\/g, '/')) || '',
      lastmod,
    );
    if (imageEntry) {
      grouped['sitemap-images.xml'].push(imageEntry);
      sitemapLastmods['sitemap-images.xml'].push(lastmod);
    }
  }

  const files = {};
  const indexEntries = [];
  for (const [name, urls] of Object.entries(grouped)) {
    if (urls.length === 0) continue;
    const urlsetTag = name === 'sitemap-images.xml'
      ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
      : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const sitemapLastmod = getLatestDateString(sitemapLastmods[name]) || new Date().toISOString().slice(0, 10);
    files[name] = `<?xml version="1.0" encoding="UTF-8"?>
${urlsetTag}
${urls.join('\n')}
</urlset>
`;
    indexEntries.push(`  <sitemap>
    <loc>${preferredSiteOrigin}/${name}</loc>
    <lastmod>${sitemapLastmod}</lastmod>
  </sitemap>`);
  }

  files['sitemap-index.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntries.join('\n')}
</sitemapindex>
`;
  files['sitemap.xml'] = files['sitemap-index.xml'];
  return files;
}

async function getPageLastmod(page) {
  const sourcePaths = [];

  if (page.contentFile) {
    sourcePaths.push(path.join(srcRoot, page.contentFile));
  }

  if (Array.isArray(page.lastmodSources)) {
    for (const source of page.lastmodSources) {
      sourcePaths.push(path.isAbsolute(source) ? source : path.join(projectRoot, source));
    }
  }

  if (sourcePaths.length === 0 && page.generatedKind) {
    sourcePaths.push(
      path.join(projectRoot, 'site-src', 'data', 'seo-v4.mjs'),
      path.join(projectRoot, 'scripts', 'build-site.mjs'),
    );
  }

  const mtimes = [];
  for (const sourcePath of [...new Set(sourcePaths.map((item) => path.resolve(item)))]) {
    const mtime = await getSourceMtime(sourcePath);
    if (mtime) {
      mtimes.push(mtime);
    }
  }

  if (mtimes.length === 0) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(Math.max(...mtimes.map((mtime) => mtime.getTime()))).toISOString().slice(0, 10);
}

async function getSourceMtime(sourcePath) {
  const key = path.resolve(sourcePath);
  if (sourceMtimeCache.has(key)) {
    return sourceMtimeCache.get(key);
  }

  try {
    const { mtime } = await stat(key);
    sourceMtimeCache.set(key, mtime);
    return mtime;
  } catch {
    sourceMtimeCache.set(key, null);
    return null;
  }
}

async function buildImageSitemapEntry(page, html, lastmod) {
  const images = await collectPageImagesForSitemap(html, page);
  if (images.length === 0) {
    return '';
  }

  const imageBlocks = images
    .map((image) => `    <image:image>
      <image:loc>${escapeHtml(image.loc)}</image:loc>
      ${image.title ? `<image:title>${escapeHtml(image.title)}</image:title>` : ''}
      ${image.caption ? `<image:caption>${escapeHtml(image.caption)}</image:caption>` : ''}
    </image:image>`)
    .join('\n');

  return `  <url>
    <loc>${escapeHtml(page.canonical)}</loc>
    <lastmod>${lastmod}</lastmod>
${imageBlocks}
  </url>`;
}

async function collectPageImagesForSitemap(html = '', page) {
  const matches = [...html.matchAll(/<img\b[^>]*>/gi)];
  const images = [];
  const seen = new Set();

  for (const match of matches) {
    const tag = match[0];
    const src = extractAttributeValue(tag, 'src');
    const normalizedSrc = normalizeImageHref(src);
    if (!normalizedSrc || !await imageAssetExistsInDist(normalizedSrc) || seen.has(normalizedSrc)) {
      continue;
    }

    seen.add(normalizedSrc);
    const alt = extractAttributeValue(tag, 'alt');
    images.push({
      loc: `${preferredSiteOrigin}${normalizedSrc}`,
      title: page.title,
      caption: alt || page.description,
    });
  }

  return images;
}

function extractAttributeValue(tag, attributeName) {
  const match = tag.match(new RegExp(`${attributeName}="([^"]*)"`, 'i'));
  return match?.[1] || '';
}

function normalizeImageHref(href = '') {
  const clean = decodeURIComponent(String(href).split('#')[0].split('?')[0].trim());
  if (!clean) return '';
  if (clean.startsWith(preferredSiteOrigin)) {
    return clean.slice(preferredSiteOrigin.length) || '/';
  }
  if (clean.startsWith(legacySiteOrigin)) {
    return clean.slice(legacySiteOrigin.length) || '/';
  }
  if (!clean.startsWith('/') || clean.startsWith('//')) {
    return '';
  }
  return clean;
}

async function imageAssetExistsInDist(href) {
  if (imageAssetExistsCache.has(href)) {
    return imageAssetExistsCache.get(href);
  }

  const assetPath = path.join(distRoot, href.replace(/^\//, '').replace(/\//g, path.sep));
  try {
    const fileStat = await stat(assetPath);
    const exists = fileStat.isFile();
    imageAssetExistsCache.set(href, exists);
    return exists;
  } catch {
    imageAssetExistsCache.set(href, false);
    return false;
  }
}

function getLatestDateString(values) {
  return [...values].sort().at(-1) || '';
}

async function writeRouteCoverageReport() {
  const report = getRouteCoverageReport();
  const reportDir = path.join(distRoot, 'reports');
  await mkdir(reportDir, { recursive: true });
  await writeFile(
    path.join(reportDir, 'route-coverage.json'),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalSuburbPages: report.length,
      routeCoverage: report,
    }, null, 2)}\n`,
    'utf8',
  );
  const csvRows = [
    ['slug', 'suburb', 'region', 'clusterKey', 'canonical', 'hubPaths', 'siblingPaths', 'guidePaths', 'traceableFrom'].join(','),
    ...report.map((row) => [
      row.slug,
      row.suburb,
      row.region,
      row.clusterKey,
      row.canonical,
      row.hubPaths.join(' | '),
      row.siblingPaths.join(' | '),
      row.guidePaths.join(' | '),
      row.traceableFrom.join(' | '),
    ].map(escapeCsv).join(',')),
  ];
  await writeFile(path.join(reportDir, 'route-coverage.csv'), `${csvRows.join('\n')}\n`, 'utf8');
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[,"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
