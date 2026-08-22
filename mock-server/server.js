/**
 * Mock chain server for the RobotEshop UI.
 *
 * Stands in for the NVIDIA blueprint backend (chain_server + catalog_retriever +
 * memory_retriever + guardrails), which needs Docker and 4x H100/A100 GPUs, and
 * eventually for the Scrapy + PostgreSQL aggregation pipeline in the proposal.
 *
 *   POST /query/stream  -> text/event-stream of `data: {json}` lines, then `data: [DONE]`
 *     {"type":"content","payload":"<token>"}      appended to the assistant message
 *     {"type":"products","payload":[{...}]}       rendered as robot spec cards
 *     {"type":"images","payload":{"<name>":"<url>"}}  legacy photo row, still supported
 *   POST /query         -> single JSON {response, products, images, timings}
 *   GET  /catalog       -> paginated browse: {total, page, products, facets}
 *                          ?category=&platform=&skill= repeat for multi-select
 *                          ?minPrice=&maxPrice=&inStock=&q=&sort=&page=
 *   GET  /tutorials     -> {count, tutorials:[{...}]} — the whole library, no paging.
 *                          Built by scraper/run_tutorials.py from archived
 *                          RobotShop Community pages; empty until that is run.
 *   GET  /health        -> {status:"ok", robots, tutorials}
 *
 * No dependencies: Node's built-in http/fs only.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8009;
const IMAGE_DIR = path.join(__dirname, '..', 'ui', 'public', 'images', 'robots');

// ---------------------------------------------------------------- catalogue

const CATALOGUE_PATH = path.join(__dirname, '..', 'scraper', 'data', 'robots.json');

/**
 * Not every source quotes in rupees — shop.unitree.com lists in USD. Prices are
 * shown in the currency the seller actually quoted, and this rate is used only
 * to put listings on a common axis for filtering, sorting, and "cheapest
 * seller". It is a hard-coded assumption, not a live rate: update it, or move
 * conversion into the scraper, before anyone treats these totals as accurate.
 */
const RATE_TO_PKR = { PKR: 1, USD: 280 };

function toPkr(price, currency) {
  return price * (RATE_TO_PKR[currency] || 1);
}

function titleCase(value) {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Local file for a listing's primary photo, falling back to the remote URL. */
function imageFor(row) {
  const images = row.images || [];
  const primary = images.find((i) => i.url === row.primary_image) || images[0];
  if (primary && primary.local_path) return primary.local_path;
  return row.primary_image || '';
}

/**
 * Reads the real scraped catalogue produced by scraper/run.py.
 *
 * One row is one listing on one site, so `match_key` is what groups the same
 * physical product across sites into a price comparison. See
 * scraper/robotshop/models.py for the full record.
 */
function loadRobots() {
  const rows = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8'))
    .filter((row) => row.name && typeof row.price === 'number');

  // Group listings that describe the same product.
  const byMatchKey = new Map();
  for (const row of rows) {
    const key = row.match_key || row.source_url;
    if (!byMatchKey.has(key)) byMatchKey.set(key, []);
    byMatchKey.get(key).push(row);
  }

  const seen = new Set();
  const catalogue = [];

  for (const row of rows) {
    const key = row.match_key || row.source_url;
    if (seen.has(key)) continue;
    seen.add(key);

    const listings = byMatchKey.get(key);
    const sellers = listings
      .map((l) => ({
        name: l.seller_name || l.source_site,
        price: l.price,
        currency: l.currency || 'PKR',
        pricePkr: toPkr(l.price, l.currency || 'PKR'),
        // The scraper does not yet establish authorised-distributor status, so
        // this is null across the board. Rendering it as false rather than
        // inventing a badge keeps the UI honest.
        verified: l.seller_verified === true,
        url: l.source_url,
      }))
      // Cheapest first, compared on a common currency.
      .sort((a, b) => a.pricePkr - b.pricePkr);

    catalogue.push({
      id: key,
      name: row.name,
      brand: row.brand || row.vendor || row.source_site,
      category: row.category || 'Uncategorised',
      subcategory: row.subcategory || null,
      summary: row.summary || row.description_text || '',
      image: imageFor(row),
      price: sellers[0].price,
      currency: sellers[0].currency,
      // Common-currency value, used for filtering and ranking only.
      pricePkr: sellers[0].pricePkr,
      offerCount: sellers.length,
      hasVerifiedSeller: sellers.some((s) => s.verified),
      sellers,
      ageMin: row.age_min ?? undefined,
      ageMax: row.age_max ?? undefined,
      skill: titleCase(row.skill_level) || 'Intermediate',
      useCase: (row.use_case || []).join(' '),
      platforms: row.supported_platforms || [],
      languages: row.programming_languages || [],
      os: row.supported_os || [],
      ros: row.ros_support ? (row.ros_version || 'ROS') : null,
      dof: row.degrees_of_freedom ?? undefined,
      tutorials: (row.tutorial_videos || []).length,
      // 92% populated. True if any seller has it, since the shopper only needs
      // one of them to actually have stock.
      inStock: listings.some((l) => l.in_stock === true),
      sourceUrl: row.source_url,
    });
  }

  return catalogue;
}

const ROBOTS = loadRobots();
const CATEGORIES = [...new Set(ROBOTS.map((r) => r.category))];
console.log(`Loaded ${ROBOTS.length} products from ${path.relative(process.cwd(), CATALOGUE_PATH)}`);
console.log(`Categories: ${CATEGORIES.join(', ')}`);

// ---------------------------------------------------------------- tutorials

const TUTORIALS_PATH = path.join(__dirname, '..', 'scraper', 'data', 'tutorials.json');

/**
 * Tutorials are optional, unlike the catalogue.
 *
 * A missing `robots.json` is fatal — without it there is no product data and
 * nothing to serve. A missing `tutorials.json` only means `run_tutorials.py`
 * has not been run yet, so the server starts, says so once, and `/tutorials`
 * answers with an empty list. The page then renders its own empty state naming
 * the command to run, which is more useful than a server that refuses to boot.
 *
 * The file is already in the exact shape `ui/src/types/index.ts` declares, so
 * there is no mapping layer here on purpose — see `tutorials/models.py`.
 */
function loadTutorials() {
  try {
    const rows = JSON.parse(fs.readFileSync(TUTORIALS_PATH, 'utf8'));
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Could not read ${TUTORIALS_PATH}: ${err.message}`);
    }
    return [];
  }
}

const TUTORIAL_LIBRARY = loadTutorials();
if (TUTORIAL_LIBRARY.length) {
  const priced = TUTORIAL_LIBRARY.filter((t) => (t.parts || []).length).length;
  console.log(
    `Loaded ${TUTORIAL_LIBRARY.length} tutorials (${priced} with a priced parts list) ` +
      `from ${path.relative(process.cwd(), TUTORIALS_PATH)}`
  );
} else {
  console.log('No tutorials loaded — run `cd scraper && python run_tutorials.py`');
}

// ---------------------------------------------------------------- search

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'any', 'are', 'can', 'do', 'does', 'for', 'get', 'got',
  'have', 'how', 'i', 'in', 'is', 'it', 'like', 'looking', 'me', 'my', 'need',
  'of', 'on', 'or', 'please', 'show', 'some', 'something', 'that', 'the',
  'this', 'to', 'want', 'what', 'with', 'would', 'you', 'your', 'robot',
  'robots', 'best', 'good', 'under', 'between', 'about', 'which', 'suitable',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    // Numbers belong to the price and age filters. Left in, "500,000" splits
    // into "500" and "000", which match no product text and sink the query.
    .filter((w) => !/^\d+$/.test(w));
}

/** Singular/plural variants so "arms" finds "arm" and "kit" finds "kits". */
function variantsOf(term) {
  const variants = new Set([term]);
  if (term.endsWith('ies') && term.length > 4) variants.add(`${term.slice(0, -3)}y`);
  if (term.endsWith('es') && term.length > 3) variants.add(term.slice(0, -2));
  if (term.endsWith('s') && term.length > 3) variants.add(term.slice(0, -1));
  variants.add(`${term}s`);
  return [...variants];
}

function matches(haystack, term) {
  return variantsOf(term).some((v) => haystack.includes(v));
}

/**
 * Terms that map onto the scraper's normalized taxonomy rather than free text.
 * Categories come from scraper/robotshop/enrich.py.
 */
const SYNONYMS = {
  sensor: 'Sensors', sensors: 'Sensors', imu: 'Sensors', gyroscope: 'Sensors',
  motor: 'Motors & Actuators', motors: 'Motors & Actuators', servo: 'Motors & Actuators',
  servos: 'Motors & Actuators', actuator: 'Motors & Actuators', stepper: 'Motors & Actuators',
  controller: 'Controllers', controllers: 'Controllers', board: 'Controllers',
  boards: 'Controllers', microcontroller: 'Controllers', mcu: 'Controllers',
  display: 'Display & Audio', displays: 'Display & Audio', screen: 'Display & Audio',
  lcd: 'Display & Audio', oled: 'Display & Audio', audio: 'Display & Audio',
  buzzer: 'Display & Audio', speaker: 'Display & Audio',
  power: 'Power', battery: 'Power', batteries: 'Power', regulator: 'Power',
  psu: 'Power', supply: 'Power',
  kit: 'Robot Kits', kits: 'Robot Kits', chassis: 'Robot Kits',
  prototyping: 'Prototyping', breadboard: 'Prototyping', jumper: 'Prototyping',
  wire: 'Prototyping', wires: 'Prototyping', solder: 'Prototyping',
  communication: 'Communication', bluetooth: 'Communication', wifi: 'Communication',
  rf: 'Communication', lora: 'Communication',
  tool: 'Tools', tools: 'Tools', stripper: 'Tools', multimeter: 'Tools',
  accessory: 'Accessories', accessories: 'Accessories',
};

/** Pull structured constraints out of a natural-language query. */
function parseFilters(query) {
  const lower = query.toLowerCase();
  const filters = {};

  const category = tokenize(query).map((t) => SYNONYMS[t]).find(Boolean);
  if (category) filters.category = category;

  // "under Rs 50,000", "below 100000", "under 50k"
  const price = lower.match(/(?:under|below|less than|cheaper than|within|budget of)\s*(?:rs\.?|pkr)?\s*([\d,]+)\s*(k|thousand|lakh)?/);
  if (price) {
    let value = parseInt(price[1].replace(/,/g, ''), 10);
    if (price[2] === 'k' || price[2] === 'thousand') value *= 1000;
    if (price[2] === 'lakh') value *= 100000;
    if (Number.isFinite(value)) filters.maxPrice = value;
  }

  // "12-year-olds", "for a 9 year old", "ages 10"
  const yearOld = lower.match(/(\d{1,2})\s*[-\s]?\s*years?\s*[-\s]?\s*old/);
  const agePrefix = lower.match(/\bages?\s*(\d{1,2})/);
  if (yearOld) filters.age = parseInt(yearOld[1], 10);
  else if (agePrefix) filters.age = parseInt(agePrefix[1], 10);


  if (/\bros\s*2\b|\bros2\b/.test(lower)) filters.ros = 'ROS 2';
  else if (/\bros\b/.test(lower)) filters.ros = 'any';

  if (/\barduino\b/.test(lower)) filters.platform = 'Arduino';
  if (/raspberry\s*pi|\brpi\b/.test(lower)) filters.platform = 'Raspberry Pi';
  if (/\besp\s*32\b|\besp32\b/.test(lower)) filters.platform = 'ESP32';
  if (/\besp\s*8266\b|\besp8266\b/.test(lower)) filters.platform = 'ESP8266';
  if (/\bstm\s*32\b|\bstm32\b/.test(lower)) filters.platform = 'STM32';

  if (/\bbeginner|\bnovice|\bstarter|first robot/.test(lower)) filters.skill = 'Beginner';
  if (/\badvanced|\bresearch\b/.test(lower)) filters.skill = 'Advanced';

  if (/\bpython\b/.test(lower)) filters.language = 'Python';
  if (/\bscratch\b/.test(lower)) filters.language = 'Scratch';
  if (/\bc\+\+|\bc\/c\+\+/.test(lower)) filters.language = 'C/C++';

  if (/\bverified\b|\btrusted\b/.test(lower)) filters.verifiedOnly = true;

  return filters;
}

function applyFilters(pool, f) {
  return pool.filter((r) => {
    if (f.category && r.category !== f.category) return false;
    if (f.maxPrice && r.pricePkr > f.maxPrice) return false;
    if (f.age && (r.ageMin > f.age || r.ageMax < f.age)) return false;
    if (f.ros === 'ROS 2' && r.ros !== 'ROS 2') return false;
    if (f.ros === 'any' && !r.ros) return false;
    if (f.platform && !r.platforms.includes(f.platform)) return false;
    if (f.skill && r.skill !== f.skill) return false;
    if (f.language && !r.languages.includes(f.language)) return false;
    if (f.verifiedOnly && !r.hasVerifiedSeller) return false;
    return true;
  });
}

// ------------------------------------------------------- catalogue browsing
//
// The chat path above is single-valued by nature: a question says "Arduino" or
// it does not. Browsing is not — a shopper ticks Sensors AND Power — so
// multi-select gets its own pair of functions rather than a rewrite of
// applyFilters(), which would change how chat search behaves.

/** 4 columns x 12 rows, matching the reference catalogue layout. */
const CATALOG_PAGE_SIZE = 48;

/** Repeatable params: ?category=Sensors&category=Power, or ?category=a,b. */
function multiParam(params, key) {
  const values = params
    .getAll(key)
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);
  return values.length > 0 ? values : null;
}

function parseCatalogQuery(params) {
  const num = (key) => {
    const raw = params.get(key);
    if (raw === null || raw === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  return {
    category: multiParam(params, 'category'),
    platform: multiParam(params, 'platform'),
    skill: multiParam(params, 'skill'),
    price: multiParam(params, 'price'),
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    inStock: params.get('inStock') === 'true' ? true : null,
    q: (params.get('q') || '').trim().toLowerCase() || null,
  };
}

/**
 * `except` names one facet group to leave out of the test.
 *
 * Counting a facet with its own selection applied is the classic faceted-search
 * bug: tick one category and every other category reads 0, so the shopper can
 * no longer see what else exists. Counting each group against all the *other*
 * filters keeps the alternatives visible.
 */
function matchesCatalog(r, f, except) {
  if (except !== 'category' && f.category && !f.category.includes(r.category)) return false;
  if (except !== 'platform' && f.platform && !f.platform.some((p) => r.platforms.includes(p))) return false;
  if (except !== 'skill' && f.skill && !f.skill.includes(r.skill)) return false;
  if (except !== 'price' && f.minPrice !== null && r.pricePkr < f.minPrice) return false;
  if (except !== 'price' && f.maxPrice !== null && r.pricePkr > f.maxPrice) return false;
  if (except !== 'price' && f.price) {
    // Bands are OR'd against each other, like every other multi-select group.
    const bands = PRICE_BANDS.filter((b) => f.price.includes(b.value));
    if (bands.length > 0 && !bands.some((b) => inBand(r.pricePkr, b))) return false;
  }
  if (except !== 'inStock' && f.inStock && !r.inStock) return false;
  if (f.q && !`${r.name} ${r.brand} ${r.category}`.toLowerCase().includes(f.q)) return false;
  return true;
}

/**
 * Prices run from Rs 1 to Rs 1.2m with a median of Rs 2,000, so a linear slider
 * would spend 99% of its travel on 1% of the catalogue. Fixed bands, counted
 * like any other facet, are both usable and honest about the distribution.
 */
const PRICE_BANDS = [
  { value: 'under-500', label: 'Under Rs 500', min: null, max: 500 },
  { value: '500-2000', label: 'Rs 500 – 2,000', min: 500, max: 2000 },
  { value: '2000-10000', label: 'Rs 2,000 – 10,000', min: 2000, max: 10000 },
  { value: '10000-50000', label: 'Rs 10,000 – 50,000', min: 10000, max: 50000 },
  { value: 'over-50000', label: 'Over Rs 50,000', min: 50000, max: null },
];

function inBand(pricePkr, band) {
  if (band.min !== null && pricePkr < band.min) return false;
  if (band.max !== null && pricePkr > band.max) return false;
  return true;
}

function countBy(pool, valuesOf) {
  const counts = new Map();
  for (const r of pool) {
    for (const value of valuesOf(r)) {
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function buildCatalog(params) {
  const filters = parseCatalogQuery(params);
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const sort = params.get('sort') || 'featured';

  const matched = ROBOTS.filter((r) => matchesCatalog(r, filters, null));

  const sorted = [...matched];
  if (sort === 'price-asc') sorted.sort((a, b) => a.pricePkr - b.pricePkr);
  else if (sort === 'price-desc') sorted.sort((a, b) => b.pricePkr - a.pricePkr);
  else if (sort === 'name-asc') sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'name-desc') sorted.sort((a, b) => b.name.localeCompare(a.name));
  else if (sort === 'sellers-desc') sorted.sort((a, b) => b.offerCount - a.offerCount);

  const start = (page - 1) * CATALOG_PAGE_SIZE;

  // The price range is drawn from everything the *other* filters allow, so
  // dragging the slider never shrinks its own track out from under the hand.
  const priceable = ROBOTS.filter((r) => matchesCatalog(r, filters, 'price')).map((r) => r.pricePkr);

  return {
    total: matched.length,
    page,
    pageSize: CATALOG_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(matched.length / CATALOG_PAGE_SIZE)),
    sort,
    filters,
    products: sorted.slice(start, start + CATALOG_PAGE_SIZE),
    facets: {
      category: countBy(ROBOTS.filter((r) => matchesCatalog(r, filters, 'category')), (r) => [r.category]),
      platform: countBy(ROBOTS.filter((r) => matchesCatalog(r, filters, 'platform')), (r) => r.platforms),
      skill: countBy(ROBOTS.filter((r) => matchesCatalog(r, filters, 'skill')), (r) => [r.skill]),
      inStock: ROBOTS.filter((r) => matchesCatalog(r, filters, 'inStock') && r.inStock).length,
      price: PRICE_BANDS.map((b) => ({
        value: b.value,
        label: b.label,
        count: priceable.filter((p) => inBand(p, b)).length,
      })),
      priceRange: {
        min: priceable.length ? Math.floor(Math.min(...priceable)) : 0,
        max: priceable.length ? Math.ceil(Math.max(...priceable)) : 0,
      },
    },
  };
}

function searchRobots(query, limit = 4) {
  const filters = parseFilters(query);
  const filtered = applyFilters(ROBOTS, filters);
  const terms = tokenize(query).filter((t) => !SYNONYMS[t]);

  const hasRealFilter = Object.keys(filters).length > 0;

  // A query that is purely structural ("arms under 500000") still needs results.
  if (terms.length === 0) {
    return {
      filters,
      results: hasRealFilter ? rank(filtered.map((r) => ({ robot: r, score: 1 })), limit) : [],
    };
  }

  const scored = filtered.map((robot) => {
    const name = `${robot.name} ${robot.brand}`.toLowerCase();
    const category = `${robot.category} ${robot.useCase}`.toLowerCase();
    const tech = [...robot.platforms, ...robot.languages, ...robot.os, robot.ros || '']
      .join(' ')
      .toLowerCase();
    const summary = (robot.summary || '').toLowerCase();

    let score = 0;
    for (const term of terms) {
      if (matches(name, term)) score += 10;
      if (matches(category, term)) score += 6;
      if (matches(tech, term)) score += 5;
      if (matches(summary, term)) score += 1;
    }
    return { robot, score };
  }).filter((e) => e.score > 0);

  // Wording like "teach kids to code" appears in no product text, but the age
  // filter it carries is a strong signal. Fall back to the filtered set rather
  // than reporting no matches.
  if (scored.length === 0) {
    return {
      filters,
      results: hasRealFilter ? rank(filtered.map((r) => ({ robot: r, score: 1 })), limit) : [],
    };
  }

  // Prefer name/category/tech hits over passing mentions in the summary.
  const strong = scored.filter((e) => e.score >= 5);
  return { filters, results: rank(strong.length > 0 ? strong : scored, limit) };
}

function rank(scored, limit) {
  scored.sort((a, b) => b.score - a.score || a.robot.pricePkr - b.robot.pricePkr);
  return scored.slice(0, limit).map((e) => e.robot);
}

// ---------------------------------------------------------------- formatting

/** Shows a price in the currency the seller actually quoted. */
function formatPrice(value, currency = 'PKR') {
  const rounded = Math.round(value);
  if (currency === 'USD') return `$${rounded.toLocaleString('en-US')}`;
  return `Rs ${rounded.toLocaleString('en-PK')}`;
}

function formatPkr(value) {
  return `Rs ${Math.round(value).toLocaleString('en-PK')}`;
}

/** One-line reason a robot matched, so the reply explains itself. */
function describe(robot) {
  const bits = [];
  if (robot.category === 'Parts & sensors') bits.push(robot.brand);
  else bits.push(`ages ${robot.ageMin}+`, robot.skill.toLowerCase());
  if (robot.ros) bits.push(robot.ros);
  return bits.join(' · ');
}

/** Trimmed payload for the UI cards. */
function toCard(robot) {
  return {
    id: robot.id,
    name: robot.name,
    brand: robot.brand,
    category: robot.category,
    image: robot.image,
    price: robot.price,
    currency: robot.currency,
    priceLabel: formatPrice(robot.price, robot.currency),
    offerCount: robot.offerCount,
    verified: robot.hasVerifiedSeller,
    ageMin: robot.ageMin,
    ageMax: robot.ageMax,
    skill: robot.skill,
    platforms: robot.platforms,
    languages: robot.languages,
    os: robot.os,
    ros: robot.ros,
    dof: robot.dof,
    tutorials: robot.tutorials,
    sellers: robot.sellers,
  };
}

// ---------------------------------------------------------------- replies

const CART_ADD = /\b(add|buy|purchase|order)\b.*\b(cart|it|this|that|one)\b|\badd to cart\b/i;
const CART_REMOVE = /\b(remove|delete|drop|take)\b.*\bcart\b/i;
const CART_VIEW = /\b(what|show|see|view).*\b(in )?my cart\b|\bcart contents\b/i;
const COMPARE = /\bcompare\b|\bdifference between\b|\bvs\.?\b|\bversus\b/i;
const TUTORIALS = /\btutorial|how (do i|to) (use|program|start)|getting started|learn/i;
const EXPLAIN = /\bwhat (is|does|are)\b|\bexplain\b|\bmean(s)?\b|\bdifference between ros/i;
const GREETING = /^\s*(hi|hey|hello|yo|good (morning|afternoon|evening))\b/i;

const carts = new Map();
const lastShown = new Map();

function getCart(userId) {
  if (!carts.has(userId)) carts.set(userId, []);
  return carts.get(userId);
}

/** Plain-language answers for the jargon the proposal says beginners struggle with. */
const GLOSSARY = [
  { test: /\bros\s*2\b|\bros\b/i, term: 'ROS', body: 'ROS (Robot Operating System) is not an operating system — it is a set of libraries and tools that let the separate parts of a robot talk to each other. ROS 2 is the current version. If a robot supports it, you can reuse existing navigation, mapping, and vision packages instead of writing them yourself. It runs on Linux.' },
  { test: /\bdof\b|degrees of freedom|\b\d-?axis\b|six.?axis|6.?axis/i, term: 'Degrees of freedom (DOF)', body: 'Degrees of freedom is the number of independent joints an arm has. A 4-axis arm can move to a position and rotate its gripper. A 6-axis arm can also tilt the gripper to any angle, which matters for tasks like inserting a screw at an angle. More axes means more flexibility and more cost.' },
  { test: /\bpayload\b/i, term: 'Payload', body: 'Payload is the heaviest object an arm can hold at full reach, including the gripper. A 3 kg payload arm holding a 1 kg gripper can only lift 2 kg of actual part.' },
  { test: /\blidar\b/i, term: 'Lidar', body: 'A lidar spins a laser to measure distance in every direction, producing a 2D or 3D map of the room. It is what lets a robot build a map and know where it is, which is called SLAM.' },
  { test: /\bslam\b/i, term: 'SLAM', body: 'SLAM stands for Simultaneous Localisation and Mapping — the robot builds a map of an unknown space while working out its own position in that map at the same time. It usually needs a lidar or a depth camera.' },
  { test: /\bservo\b/i, term: 'Servo', body: 'A servo is a motor that holds a commanded angle rather than just spinning. Smart servos, like Dynamixel, also report their position, load, and temperature back to the controller.' },
  { test: /\bsdk\b|\bapi\b/i, term: 'SDK', body: 'An SDK is the official code library a manufacturer provides so you can control the robot from your own program. Without one you are limited to the vendor app.' },
  { test: /\bi2c\b/i, term: 'I2C', body: 'I2C is a two-wire bus that lets one controller talk to many modules at once, each with its own address. It is why a single Arduino can read a gyroscope, a display, and a temperature sensor over the same two pins.' },
  { test: /\bspi\b/i, term: 'SPI', body: 'SPI is a faster four-wire bus than I2C, used where speed matters — displays and SD cards mostly. Each device needs its own select pin, so it costs more pins than I2C.' },
  { test: /\bpwm\b/i, term: 'PWM', body: 'PWM switches a pin on and off very fast to control how much power reaches a motor or LED. Change the ratio of on to off and you change motor speed or LED brightness without a variable resistor.' },
  { test: /\besp\s*32\b|\besp32\b/i, term: 'ESP32', body: 'The ESP32 is a microcontroller with Wi-Fi and Bluetooth built in. It is the usual pick over a plain Arduino when the project needs to talk to a phone or a network, and it is programmed the same way.' },
  { test: /\bimu\b/i, term: 'IMU', body: 'An IMU combines an accelerometer and a gyroscope so a robot can sense how it is tilted and how fast it is turning. It is what keeps a balancing robot upright.' },
  { test: /\bstepper\b/i, term: 'Stepper motor', body: 'A stepper motor turns in fixed increments rather than spinning freely, so you can command an exact number of steps and know where it ended up without a sensor. Used where position must be repeatable, like 3D printers.' },
];

function buildReply(userId, query, hasImage) {
  const cart = getCart(userId);
  const recent = lastShown.get(userId) || [];

  if (hasImage) {
    const pool = recent.length > 0 ? ROBOTS.filter((r) => r.category === recent[0].category) : ROBOTS;
    const picks = pool.slice(0, 4);
    lastShown.set(userId, picks);
    return {
      text: `I ran a visual match on that image. 📸 These are the closest robots in the catalogue:\n\nAsk me to compare any two, or to show the sellers for one.`,
      products: picks.map(toCard),
    };
  }

  if (CART_VIEW.test(query)) {
    if (cart.length === 0) {
      return { text: `Your list is empty. 🛒 Tell me what the robot is for — a classroom, a final-year project, a production line — and I will shortlist some.`, products: [] };
    }
    const lines = cart.map((r) => `- **${r.name}** — ${formatPrice(r.price, r.currency)}`);
    const total = cart.reduce((sum, r) => sum + r.pricePkr, 0);
    return { text: `Your shortlist 🛒\n\n${lines.join('\n')}\n\n**Total: ${formatPkr(total)}**`, products: [] };
  }

  if (CART_REMOVE.test(query)) {
    const named = cart.find((r) => query.toLowerCase().includes(r.name.toLowerCase()));
    const target = named || cart[cart.length - 1];
    if (!target) return { text: `Your list is already empty — nothing to remove. 🛒`, products: [] };
    carts.set(userId, cart.filter((r) => r !== target));
    return { text: `Done — I removed **${target.name}** from your cart. 🗑️`, products: [] };
  }

  if (CART_ADD.test(query)) {
    const named = ROBOTS.find((r) => query.toLowerCase().includes(r.name.toLowerCase()));
    const target = named || recent[0];
    if (!target) return { text: `Happy to. Which one? Tell me what you need the robot for and I will shortlist a few first. 🤖`, products: [] };
    cart.push(target);
    const best = [...target.sellers].sort((a, b) => a.pricePkr - b.pricePkr)[0];
    return {
      text: `Added **${target.name}** to your cart 🛒 — ${formatPrice(target.price, target.currency)} from ${best.name}${best.verified ? ' (verified seller)' : ''}.\n\nThat is ${cart.length} item${cart.length === 1 ? '' : 's'} on your list.`,
      products: [],
    };
  }

  if (COMPARE.test(query)) {
    const named = ROBOTS.filter((r) =>
      query.toLowerCase().includes(r.name.toLowerCase()) ||
      query.toLowerCase().includes(r.brand.toLowerCase())
    );
    const picks = named.length >= 2 ? named.slice(0, 3) : (searchRobots(query, 3).results.length >= 2 ? searchRobots(query, 3).results : recent.slice(0, 3));
    if (picks.length < 2) {
      return { text: `Tell me which two to compare — for example *compare TurtleBot3 Burger and JetBot*.`, products: [] };
    }
    lastShown.set(userId, picks);
    const rows = picks.map((r) =>
      `**${r.name}** — ${formatPrice(r.price, r.currency)} · ${r.skill} · ${r.ros || 'no ROS'} · ${r.platforms.join(', ')} · ${r.tutorials} tutorials`
    );
    return {
      text: `Here they are side by side: ⚖️\n\n${rows.join('\n')}\n\nThe practical difference: ${picks[0].name} is ${picks[0].price < picks[1].price ? 'cheaper' : 'pricier'} and ${picks[0].ros ? 'runs ROS' : 'has no ROS support'}, while ${picks[1].name} ${picks[1].ros ? `runs ${picks[1].ros}` : 'does not support ROS'}.`,
      products: picks.map(toCard),
    };
  }

  if (TUTORIALS.test(query)) {
    const named = ROBOTS.find((r) => query.toLowerCase().includes(r.name.toLowerCase()));
    const target = named || recent[0];
    if (target) {
      return {
        text: `**${target.name}** has ${target.tutorials} tutorials in the library. ▶️\n\nA sensible order:\n\n- Unboxing and assembly\n- First program in ${target.languages[0]}\n- Wiring the sensors\n- ${target.ros ? `Bringing it up under ${target.ros}` : 'Building your own behaviour'}\n\nWant me to open the getting-started video?`,
        products: [],
      };
    }
  }

  if (EXPLAIN.test(query)) {
    const entry = GLOSSARY.find((g) => g.test.test(query));
    if (entry) {
      return { text: `**${entry.term}** 💡\n\n${entry.body}`, products: [] };
    }
  }

  if (GREETING.test(query)) {
    return {
      text: `Hello! 👋 I help you find robotics parts and compare what they cost across sellers.\n\nTry:\n\n- Show me motion sensors under Rs 500\n- What works with ESP32?\n- Beginner parts for a first Arduino build\n- What does I2C mean?`,
      products: [],
    };
  }

  const { filters, results } = searchRobots(query, 4);

  if (results.length === 0) {
    // Be specific about *why* nothing matched when the gap is in the data
    // rather than in the query.
    if (filters.ros) {
      return {
        text: `Nothing in the catalogue advertises ROS support yet. 🤔 The crawl so far only covers Robo.pk, whose range is components and modules rather than full ROS platforms.\n\nIf you tell me what you are building, I can suggest the parts for it instead.`,
        products: [],
      };
    }
    return {
      text: `Nothing matches that yet. 🤔 The catalogue currently covers:\n\n${CATEGORIES.map((c) => `- ${c}`).join('\n')}\n\nWhat are you building?`,
      products: [],
    };
  }

  lastShown.set(userId, results);

  // Say which constraints were understood — it makes the filtering visible.
  const applied = [];
  if (filters.category) applied.push(filters.category.toLowerCase());
  if (filters.maxPrice) applied.push(`under ${formatPkr(filters.maxPrice)}`);
  if (filters.age) applied.push(`suitable at age ${filters.age}`);
  if (filters.ros) applied.push(filters.ros === 'any' ? 'with ROS support' : `running ${filters.ros}`);
  if (filters.platform) applied.push(`on ${filters.platform}`);
  if (filters.skill) applied.push(filters.skill.toLowerCase());
  if (filters.language) applied.push(`programmable in ${filters.language}`);

  const lead = applied.length > 0
    ? `Found ${results.length} match${results.length === 1 ? '' : 'es'} — ${applied.join(', ')}. ✨`
    : `Found ${results.length} option${results.length === 1 ? '' : 's'} for you. ✨`;

  const lines = results.map((r) => `- **${r.name}** — ${formatPrice(r.price, r.currency)} · ${describe(r)}`);

  return {
    text: `${lead}\n\n${lines.join('\n')}\n\nAsk me to compare two of them, or to show every seller's price.`,
    products: results.map(toCard),
  };
}

// ---------------------------------------------------------------- http

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function handleStream(req, res, body) {
  const userId = String(body.user_id || 'anonymous');
  const query = body.query || '';
  const hasImage = Boolean(body.image_bool && body.image);

  res.writeHead(200, {
    ...CORS_HEADERS,
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const { text, products } = buildReply(userId, query, hasImage);

  const tokens = text.split(/(\s+)/).filter((t) => t.length > 0);
  for (const token of tokens) {
    res.write(`data: ${JSON.stringify({ type: 'content', payload: token })}\n\n`);
    await sleep(16);
  }

  // Cards come after the text: the UI turns the current assistant message into
  // the card row, then re-pushes the accumulated text below it.
  if (products.length > 0) {
    await sleep(120);
    res.write(`data: ${JSON.stringify({ type: 'products', payload: products })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();

  console.log(`[stream] user=${userId} image=${hasImage} results=${products.length} query=${JSON.stringify(query)}`);
}

async function handleQuery(req, res, body) {
  const userId = String(body.user_id || 'anonymous');
  const { text, products } = buildReply(userId, body.query || '', Boolean(body.image_bool && body.image));

  // `images` is kept for anything still speaking the original blueprint shape.
  const images = {};
  for (const p of products) images[p.name] = p.image;

  res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ response: text, products, images, timings: { total: 0.1 } }));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const url = (req.url || '').replace(/^\/api/, '') || '/';

  try {
    if (req.method === 'GET' && url.startsWith('/health')) {
      res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        robots: ROBOTS.length,
        tutorials: TUTORIAL_LIBRARY.length,
      }));
      return;
    }

    if (req.method === 'GET' && url.startsWith('/tutorials')) {
      // The whole library in one response. It is 87 rows, and the page filters
      // and facets client-side, so paginating it would add a round trip and a
      // query-string contract for no gain. Revisit if it reaches the thousands.
      res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ tutorials: TUTORIAL_LIBRARY, count: TUTORIAL_LIBRARY.length }));
      return;
    }

    if (req.method === 'GET' && url.startsWith('/catalog')) {
      const params = new URL(url, 'http://localhost').searchParams;
      res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(buildCatalog(params)));
      return;
    }

    if (req.method === 'POST' && url.startsWith('/query/stream')) {
      await handleStream(req, res, await readBody(req));
      return;
    }

    if (req.method === 'POST' && url.startsWith('/query')) {
      await handleQuery(req, res, await readBody(req));
      return;
    }

    res.writeHead(404, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `No route for ${req.method} ${url}` }));
  } catch (err) {
    console.error('Request failed:', err);
    if (!res.headersSent) {
      res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: String(err) }));
  }
});

server.listen(PORT, () => {
  console.log(`Mock chain server listening on http://localhost:${PORT}`);
});
