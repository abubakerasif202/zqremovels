import { copyFile, cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

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
await copyFile(path.join(projectRoot, 'premium-site.css'), path.join(distRoot, 'premium-site.min.css'));

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
  const tags = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(page.description)}" />`,
    `<link rel="canonical" href="${escapeAttribute(page.canonical)}" />`,
    `<meta name="theme-color" content="${escapeAttribute(page.themeColor || '#0A192F')}" />`,
    `<meta name="robots" content="${escapeAttribute(page.robots || 'index,follow,max-image-preview:large')}" />`,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    `<meta property="og:type" content="${escapeAttribute(page.ogType || 'website')}" />`,
    '<meta property="og:site_name" content="ZQ Removals" />',
    '<meta property="og:locale" content="en_AU" />',
    `<meta property="og:url" content="${escapeAttribute(page.ogUrl || page.canonical)}" />`,
    `<meta property="og:title" content="${escapeAttribute(page.ogTitle || page.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(page.ogDescription || page.description)}" />`,
    `<meta property="og:image" content="${escapeAttribute(page.ogImage)}" />`,
    `<meta name="twitter:card" content="${escapeAttribute(page.twitterCard || 'summary_large_image')}" />`,
    `<meta name="twitter:title" content="${escapeAttribute(page.twitterTitle || page.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(page.twitterDescription || page.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttribute(page.twitterImage || page.ogImage)}" />`,
  ];

  if (page.layout !== 'redirect') {
    tags.push('<link rel="stylesheet" href="/premium-site.min.css" />');
  }

  for (const stylesheet of page.extraStylesheets || []) {
    tags.push(`<link rel="stylesheet" href="${escapeAttribute(stylesheet)}" />`);
  }

  if (page.refresh) {
    tags.push(`<meta http-equiv="refresh" content="${escapeAttribute(page.refresh)}" />`);
  }

  for (const jsonLd of page.jsonLd || []) {
    tags.push(`<script type="application/ld+json">\n${jsonLd}\n</script>`);
  }

  for (const jsonLd of buildDynamicJsonLd(page, content)) {
    tags.push(`<script type="application/ld+json">\n${jsonLd}\n</script>`);
  }

  return tags.join('\n');
}

function buildDynamicJsonLd(page, content) {
  const blocks = [];
  const faqJsonLd = buildFaqJsonLd(page, content);

  if (faqJsonLd) {
    blocks.push(faqJsonLd);
  }

  return blocks;
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

function pageHasFaqJsonLd(page) {
  return (page.jsonLd || []).some((jsonLd) => jsonLd.includes('"@type": "FAQPage"'));
}

function extractFaqPairs(content) {
  const itemPattern =
    /<article class="faq-item"[\s\S]*?<h3 class="faq-question"[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<p[^>]*itemprop="text"[^>]*>([\s\S]*?)<\/p>[\s\S]*?<\/article>/gi;
  const pairs = [];

  for (const match of content.matchAll(itemPattern)) {
    const question = cleanHtmlText(match[1]);
    const answer = cleanHtmlText(match[2]);

    if (question && answer) {
      pairs.push({ question, answer });
    }
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
  let next = content.replaceAll('href="/#quote-form"', 'href="/contact-us/#quote-form"');
  next = next.replace(/\/contact-us(?:\/contact-us)+\/#quote-form/g, '/contact-us/#quote-form');

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
  const supplementalSections = [proofSection, faqSection, seoSupport].filter(Boolean).join('\n');

  if (supplementalSections && next.includes('</main>')) {
    next = next.replace('</main>', `${supplementalSections}\n</main>`);
  }

  return next;
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
