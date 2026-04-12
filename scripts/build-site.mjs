import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { transform } from 'lightningcss';

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

const pages = JSON.parse(await readFile(path.join(srcRoot, 'pages.json'), 'utf8'));
const defaultSocialImage = 'https://zqremovals.au/zq-removals-social-share.webp';
const defaultLogoImage = 'https://zqremovals.au/brand-logo.webp';
const googleBusinessProfileUrl = 'https://share.google/Y04mpt9RTflWP3iRl';
const gaMeasurementId = process.env.GA_MEASUREMENT_ID?.trim() || '';
const googleSiteVerificationToken =
  process.env.GOOGLE_SITE_VERIFICATION?.trim() || '';
const SUBURB_PAGE_WORD_MIN = 600;
const SUBURB_PAGE_WORD_MAX = 900;
const SUBURB_CONDITION_HEADING_WORDS = 4;
const SUBURB_PADDING_PARAGRAPH =
  'Every move is reviewed for access, inventory, and timing before scheduling, so clients receive a practical plan supported by experienced local movers.';

const suburbPageProfiles = {
  'adelaide-cbd': {
    suburb: 'Adelaide CBD',
    nearby: 'North Terrace, King William Street, Rundle Mall, Grenfell Street, and Waymouth Street',
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
    h1: 'Salisbury removalists for family homes, storage transfers, and northern Adelaide moves.',
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
      'Sequencing garage items, outdoor settings, and heavier furniture so the load stays stable and protected',
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
  elizabeth: {
    suburb: 'Elizabeth',
    nearby: 'Main North Road, Philip Highway, Yorktown Road, Midway Road, and Elizabeth Way',
    hero:
      'Elizabeth moves often involve homes, units, garage loads, and storage transitions that need a clear scope and structured handling plan.',
    intro: [
      'When customers search for removalists in Elizabeth, they usually need practical help with mixed household and storage-related inventory. Routes around Main North Road and Philip Highway can appear simple, but timing and access still affect efficiency when parking or carry paths are unclear. We scope these details before the booking is confirmed.',
      'Elizabeth jobs also vary from family homes and units to garage-heavy loads and small business stock. Our team plans each move around item profile, property type, and route order so important pieces arrive in the right sequence and the unload does not become disorganised.',
    ],
    conditions: [
      'Checking driveway, street access, and stair constraints before move day',
      'Structuring garage and storage items to avoid double handling',
      'Planning timing across northern corridors linked by Main North Road',
    ],
    scenarios: [
      {
        title: 'Family home and unit moves',
        copy:
          'Elizabeth home relocations often involve full-room inventory and heavier household pieces. We organise furniture flow and room placement so the destination setup is faster and less stressful.',
      },
      {
        title: 'Garage, shed, and storage-heavy loads',
        copy:
          'Loads with tools, shelving, boxes, and mixed items need better sequencing than a standard home move. We separate priority items and allocate handling steps that keep the run controlled.',
      },
      {
        title: 'Business and mixed-use transitions',
        copy:
          'Where office furniture or stock is included, we build the plan around restart needs. That helps reduce downtime and keeps critical business items easier to locate on delivery.',
      },
    ],
    trust: [
      'ZQ Removals is trusted by Adelaide families and businesses for dependable planning, careful item handling, and straightforward communication. Our experienced crews treat each move as an operational job, not just transport.',
      'We support local and interstate pathways from the same process, so clients can keep continuity if the route expands later. That consistency reduces risk and improves confidence before move day.',
    ],
    services:
      'You can compare our Adelaide local movers, packing support, office removals, furniture handling, and interstate services to build the right move brief.',
  },
  marion: {
    suburb: 'Marion',
    nearby: 'Marion Road, Sturt Road, Diagonal Road, Morphett Road, and Oaklands Road',
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
};

const seoGuideLibrary = {
  cost: {
    title: 'Removalists cost guide',
    url: '/adelaide-moving-guides/removalists-cost-adelaide/',
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
        guide: 'cost',
        description:
          'Use the pricing guide before comparing Seaford quotes so travel time, access, and inventory volume are framed properly.',
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

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
const premiumSiteCss = await readFile(path.join(projectRoot, 'premium-site.css'), 'utf8');
await writeFile(
  path.join(distRoot, 'premium-site.min.css'),
  `${minifyCss(premiumSiteCss)}\n`,
  'utf8',
);

for (const page of pages) {
  const contentPath = path.join(srcRoot, page.contentFile);
  let content = await readFile(contentPath, 'utf8');
  content = transformContent(content, page);

  const head = renderHead(page, content);
  const bodyAttributes = renderBodyAttributes(page);
  const template = templates[page.layout] ?? templates.standard;

  const html = template
    .replace('{{HEAD}}', indent(head, 4))
    .replace('{{BODY_ATTRIBUTES}}', bodyAttributes)
    .replace('{{HEADER}}', indent(page.layout === 'standard' ? partials.header : '', 4))
    .replace('{{CONTENT}}', indent(content.trim(), 4))
    .replace('{{FOOTER}}', indent(page.layout === 'standard' ? partials.footer : '', 4));

  const distOutputPath = path.join(distRoot, page.output);
  await mkdir(path.dirname(distOutputPath), { recursive: true });
  await writeFile(distOutputPath, `${html.trim()}\n`, 'utf8');
  console.log(`built ${page.output}`);
}

const sitemap = await renderSitemap(pages);
await writeFile(path.join(distRoot, 'sitemap.xml'), sitemap, 'utf8');

await copyStaticAssets();

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

    if (gaMeasurementId) {
      tags.push(
        `<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaMeasurementId)}"></script>`,
      );
      tags.push(`<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaMeasurementId)});
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
  const webPageJsonLd = buildWebPageJsonLd(page);
  const serviceJsonLd = buildServiceJsonLd(page);

  if (businessJsonLd) {
    blocks.push(businessJsonLd);
  }

  if (webPageJsonLd) {
    blocks.push(webPageJsonLd);
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
      telephone: '+61 433 819 989',
      image: defaultSocialImage,
      logo: defaultLogoImage,
      hasMap: googleBusinessProfileUrl,
      sameAs: [googleBusinessProfileUrl],
      openingHours: 'Mo-Su 00:00-23:59',
      priceRange: '$150/hr',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Andrews Farm',
        addressRegion: 'SA',
        postalCode: '5114',
        addressCountry: 'AU',
      },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          telephone: '+61 433 819 989',
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

function buildWebPageJsonLd(page) {
  if (pageHasJsonLdType(page, 'WebPage') || pageHasJsonLdType(page, 'ContactPage') || pageHasJsonLdType(page, 'AboutPage')) {
    return '';
  }

  if ((page.robots || '').includes('noindex')) {
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
  if ((page.robots || '').includes('noindex')) {
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
  const { aggregateRating, review, sameAs = [], hasMap, image, logo, ...rest } = node;

  return {
    ...rest,
    '@id': 'https://zqremovals.au/#business',
    name: 'ZQ Removals',
    url: 'https://zqremovals.au/',
    telephone: '+61 433 819 989',
    image: defaultSocialImage,
    logo: defaultLogoImage,
    hasMap: googleBusinessProfileUrl,
    sameAs: Array.from(new Set([googleBusinessProfileUrl, ...sameAs].filter(Boolean))),
    openingHours: 'Mo-Su 00:00-23:59',
    priceRange: '$150/hr',
    address: {
      '@type': 'PostalAddress',
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
        telephone: '+61 433 819 989',
        areaServed: ['Adelaide', 'South Australia', 'Australia'],
        availableLanguage: ['en'],
        url: 'https://zqremovals.au/contact-us/',
      },
    ],
  };
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
    /<article class="faq-item"[\s\S]*?<h3 class="faq-question"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*itemprop="text"[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/article>/gi;
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
    return value;
  }

  if (value.startsWith('/')) {
    return `https://zqremovals.au${value}`;
  }

  return value;
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
    output === 'adelaide-to-sydney-removals/index.html'
  ) {
    classes.push('page-interstate');
  } else if (output === 'office-removals-adelaide/index.html') {
    classes.push('page-service-operations');
  } else if (output === 'packing-services-adelaide/index.html') {
    classes.push('page-service-packing');
  } else if (output === 'furniture-removalists-adelaide/index.html') {
    classes.push('page-service-furniture');
  } else if (output === 'house-removals-adelaide/index.html') {
    classes.push('page-service-local');
  } else if (output === 'removalists-adelaide/index.html') {
    classes.push('page-service-local');
  } else if (output.startsWith('removalists-')) {
    classes.push('page-suburb');
  } else if (output === '404.html' || output === 'thank-you.html') {
    classes.push('page-utility');
  }

  if (output === 'thank-you.html') {
    classes.push('thank-you-page');
  }

  return classes;
}

function transformContent(content, page) {
  let next = renderSuburbPage(page) || content;
  next = next.replaceAll('href="/#quote-form"', 'href="/contact-us/#quote-form"');
  next = next.replace(/\/contact-us(?:\/contact-us)+\/#quote-form/g, '/contact-us/#quote-form');
  next = sanitizePublicCopy(next);

  if (page.output === 'index.html') {
    next = next
      .replaceAll('/zq-removals-social-share.png', '/zq-removals-social-share.webp')
      .replaceAll('/brand-logo.png', '/brand-logo.webp')
      .replaceAll('/screen.png', '/screen.webp');
  }

  if (next.includes('class="hero-section"')) {
    next = next.replaceAll('/brand-logo.png', '/zq-removals-social-share.webp');
  }

  const proofSection = renderLocalProofSection(page);
  const faqSection = renderFaqSection(page, next);
  const seoSupport = renderSeoSupportSection(page);
  const relatedLinks = renderRelatedLinksSection(page);
  const supplementalSections = [proofSection, faqSection, seoSupport, relatedLinks]
    .filter(Boolean)
    .join('\n');

  if (supplementalSections && next.includes('</main>')) {
    next = next.replace('</main>', `${supplementalSections}\n</main>`);
  }

  return next;
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

function renderSuburbPage(page) {
  const profile = getSuburbProfile(page);
  if (!profile) {
    return '';
  }

  const wordCount = suburbWordCount(profile);
  const targetCopy =
    wordCount < SUBURB_PAGE_WORD_MIN
      ? `${profile.services} We also provide transparent quote reviews and route-specific planning so the scope is clear before your moving date is locked.`
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
        'Suburb-focused planning and clearer access notes',
        'Homes, units, and mixed inventory scoped before quoting',
        'Fixed-price quotes built around the real brief',
      ];

  const startHere = profile.startHere || {
    eyebrow: 'When to use this page',
    heading: `When this ${profile.suburb} page is the right starting point`,
    intro:
      'Use this page when the suburb is known and you want the quote scoped around the access and inventory conditions that tend to show up here.',
    points: [
      'You already know the pickup or delivery suburb is inside this area',
      'Access, stairs, parking, or carry distance will influence labour time',
      'You want packing help or fragile handling included in the same brief',
    ],
  };

  const nearbyLinks = Array.isArray(profile.nearbyLinks) ? profile.nearbyLinks : [];

  return `
<main id="main-content">
<section class="hero-shell">
<div class="container">
<nav aria-label="Breadcrumb" class="breadcrumb">
<ol>
<li><a href="/">Home</a></li>
<li><a href="/removalists-adelaide/">Removalists Adelaide</a></li>
<li>${escapeHtml(profile.suburb)}</li>
</ol>
</nav>
<div class="page-hero-grid">
<div class="page-hero-copy">
<span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
<h1>${escapeHtml(heroHeading)}</h1>
<p class="lead">${escapeHtml(heroLead)}</p>
<ul aria-label="${escapeAttribute(profile.suburb)} move highlights" class="route-meta">
${heroHighlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}
</ul>
<div class="cta-cluster">
<a class="button button-primary" href="/contact-us/#quote-form">Get a Fixed-Price Quote</a>
<a class="button button-secondary" href="tel:+61433819989">Call 0433 819 989</a>
</div>
</div>
</div>
</div>
</section>
<section class="section">
<div class="container">
<div class="section-heading">
<span class="eyebrow">Suburb moving brief</span>
<h2>Local route planning for ${escapeHtml(profile.suburb)} moves</h2>
</div>
<p>${escapeHtml(profile.intro[0])}</p>
<p>${escapeHtml(profile.intro[1])}</p>
<p>Common local references for this suburb include ${escapeHtml(profile.nearby)}.</p>
</div>
</section>
<section class="section section-soft">
<div class="container">
<div class="section-heading">
<span class="eyebrow">${escapeHtml(startHere.eyebrow)}</span>
<h2>${escapeHtml(startHere.heading)}</h2>
<p>${escapeHtml(startHere.intro)}</p>
</div>
<ul class="bullet-list">
${(startHere.points || []).map((point) => `<li>${escapeHtml(point)}</li>`).join('\n')}
</ul>
${
  nearbyLinks.length > 0
    ? `<h3>Nearby areas people often compare</h3>
<ul class="bullet-list">
${nearbyLinks.map(({ href, label }) => (href ? `<li><a href="${escapeAttribute(href)}">${escapeHtml(label)}</a></li>` : `<li>${escapeHtml(label)}</li>`)).join('\n')}
</ul>`
    : ''
}
</div>
</section>
<section class="section section-soft">
<div class="container">
<div class="section-heading">
<span class="eyebrow">Local conditions</span>
<h2>What we account for before move day</h2>
</div>
<div class="value-grid">
${profile.conditions
  .map((condition) => {
    const conditionHeading = condition.split(/\s+/).slice(0, SUBURB_CONDITION_HEADING_WORDS).join(' ');
    return `<article class="value-card">
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
<div class="section-heading">
<span class="eyebrow">Suburb-specific scenarios</span>
<h2>Moving situations we commonly manage in ${escapeHtml(profile.suburb)}</h2>
</div>
<div class="timeline-grid">
${profile.scenarios
  .map(
    ({ title, copy }, index) => `<article class="timeline-card">
  <small>Scenario ${String(index + 1).padStart(2, '0')}</small>
  <h3>${escapeHtml(title)}</h3>
  <p>${escapeHtml(copy)}</p>
</article>`,
  )
  .join('\n')}
</div>
</div>
</section>
<section class="section section-soft">
<div class="container">
<div class="section-heading">
<span class="eyebrow">Trust and experience</span>
<h2>Why clients choose ZQ Removals</h2>
</div>
<p>${escapeHtml(profile.trust[0])}</p>
<p>${escapeHtml(profile.trust[1])}</p>
${extraParagraph}
<p>${escapeHtml(targetCopy)}</p>
<h3>Related moving services</h3>
<ul aria-label="Internal service links" class="bullet-list">
<li><a href="/house-removals-adelaide/">House Removals Adelaide</a></li>
<li><a href="/removalists-adelaide/">Removalists Adelaide</a></li>
<li><a href="/packing-services-adelaide/">Packing Services Adelaide</a></li>
<li><a href="/furniture-removalists-adelaide/">Furniture Removalists Adelaide</a></li>
<li><a href="/office-removals-adelaide/">Office Relocations Adelaide</a></li>
<li><a href="/interstate-removals-adelaide/">Interstate Removals Adelaide</a></li>
<li><a href="/contact-us/#quote-form">Request a moving quote</a></li>
</ul>
</div>
</section>
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

function renderRelatedLinksSection(page) {
  const profile = getRelatedLinksProfile(page);
  if (!profile) {
    return '';
  }

  const sectionId = `${page.output.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-related-links`;
  const cards = profile.links
    .map(
      ({ eyebrow, title, copy, url, cta }) => `<article class="route-card">
<small>${escapeHtml(eyebrow)}</small>
<h3>${escapeHtml(title)}</h3>
<p>${escapeHtml(copy)}</p>
<a class="button-link" href="${escapeAttribute(url)}">${escapeHtml(cta)}</a>
</article>`,
    )
    .join('\n');

  return `
<section aria-labelledby="${sectionId}" class="section section-soft">
<div class="container">
<div class="section-heading">
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
      eyebrow: 'Related services',
      heading: 'Choose the service that matches the move.',
      intro:
        'If the brief includes packing, delicate furniture, office equipment, or a longer route, start with the matching service page.',
      links: [
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
          eyebrow: 'Quote',
          title: 'Request a fixed-price quote',
          copy: 'Send the addresses, property type, and access notes for a clear Adelaide move quote.',
          url: '/contact-us/#quote-form',
          cta: 'Request a quote',
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
    return {
      eyebrow: 'Plan the full move',
      heading: 'Useful links for the rest of the move.',
      intro:
        'Use the Adelaide local removals page for broader suburb coverage, add support for delicate items or packing, or request a fixed-price quote when the brief is ready.',
      links: [
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
      ({ question, answer }) => `<article class="faq-item" itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
  <h3 class="faq-question" itemprop="name">${escapeHtml(question)}</h3>
  <div class="faq-answer" itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
    <p itemprop="text">${escapeHtml(answer)}</p>
  </div>
</article>`,
    )
    .join('\n');

  return `
<section aria-labelledby="${sectionId}" class="section section-split">
<div class="container">
<div class="section-heading">
<span class="eyebrow">${escapeHtml(profile.eyebrow)}</span>
<h2 id="${sectionId}">${escapeHtml(profile.heading)}</h2>
<p>${escapeHtml(profile.intro)}</p>
</div>
<div class="faq-list" itemscope itemtype="https://schema.org/FAQPage">
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
      ({ title, copy, points }) => `<article class="value-card">
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
<div class="section-heading">
<span class="eyebrow">${escapeHtml(profile.eyebrow)}</span>
<h2 id="${sectionId}">${escapeHtml(profile.heading)}</h2>
<p>${escapeHtml(profile.intro)}</p>
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

      return `<article class="value-card">
  <h3>${escapeHtml(meta.title)}</h3>
  <p>${escapeHtml(description)}</p>
  <a class="button button-secondary" href="${escapeAttribute(meta.url)}">${escapeHtml(meta.cta)}</a>
</article>`;
    })
    .filter(Boolean)
    .join('\n');

  const supportLinks = (profile.supportLinks || [])
    .map(
      ({ url, label }) =>
        `<li><a href="${escapeAttribute(url)}">${escapeHtml(label)}</a></li>`,
    )
    .join('\n');

  return `
<section aria-labelledby="${sectionId}" class="section section-soft">
<div class="container">
<div class="section-heading">
<span class="eyebrow">${escapeHtml(profile.eyebrow)}</span>
<h2 id="${sectionId}">${escapeHtml(profile.heading)}</h2>
<p>${escapeHtml(profile.intro)}</p>
</div>
<div class="value-grid">
${cards}
</div>
${
  supportLinks
    ? `<p class="field-note">Also useful while planning this move:</p>
<ul class="bullet-list">
${supportLinks}
</ul>`
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

async function copyStaticAssets() {
  const fileAssets = [
    'brand-logo.png',
    'brand-logo-64.webp',
    'brand-logo-256.webp',
    'brand-logo-96.webp',
    'brand-logo.webp',
    'favicon.ico',
    'favicon.svg',
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
  await cp(path.join(projectRoot, 'media'), path.join(distRoot, 'media'), { recursive: true });
}

async function renderSitemap(pages) {
  const urls = [];

  for (const page of pages) {
    if (page.output === 'privacy-policy/index.html' || page.output === 'terms-and-conditions/index.html') {
      continue;
    }

    if ((page.robots || '').includes('noindex')) {
      continue;
    }

    const contentPath = path.join(srcRoot, page.contentFile);
    const { mtime } = await stat(contentPath);
    const meta = getSitemapMeta(page);

    urls.push(`  <url>
    <loc>${escapeHtml(page.canonical)}</loc>
    <lastmod>${mtime.toISOString().slice(0, 10)}</lastmod>
    <changefreq>${meta.changefreq}</changefreq>
    <priority>${meta.priority}</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
}

function getSitemapMeta(page) {
  if (page.output === 'index.html') {
    return { changefreq: 'monthly', priority: '1.0' };
  }

  if (page.output === 'removalists-adelaide/index.html') {
    return { changefreq: 'monthly', priority: '0.9' };
  }

  if (
    page.output === 'adelaide-moving-guides/index.html' ||
    page.output === 'house-removals-adelaide/index.html' ||
    page.output === 'furniture-removalists-adelaide/index.html' ||
    page.output === 'office-removals-adelaide/index.html' ||
    page.output === 'interstate-removals-adelaide/index.html' ||
    page.output === 'adelaide-to-melbourne-removals/index.html' ||
    page.output === 'adelaide-to-sydney-removals/index.html' ||
    page.output === 'packing-services-adelaide/index.html'
  ) {
    return { changefreq: 'monthly', priority: '0.8' };
  }

  if (page.output.startsWith('adelaide-moving-guides/')) {
    return { changefreq: 'monthly', priority: '0.7' };
  }

  if (page.output === 'contact-us/index.html') {
    return { changefreq: 'monthly', priority: '0.7' };
  }

  if (page.output.startsWith('removalists-')) {
    return { changefreq: 'monthly', priority: '0.8' };
  }

  return { changefreq: 'monthly', priority: '0.7' };
}
