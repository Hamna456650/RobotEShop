# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

RobotEshop (product name **Servo**) is a final-year degree project: *"A Unified
Web Aggregation Platform for Educational and Industrial Robots"*. The scope is
fixed by [FYDP-DSE_005_Proposal_Template.pdf](FYDP-DSE_005_Proposal_Template.pdf)
— that document is the spec, and every feature here traces back to one of its
objectives:

1. Centralised marketplace aggregating robot data from many sources
2. Complete hardware **and software** detail — platforms, programming tools, OS support
3. Search, filter, and side-by-side compare
4. Trusted / verified sellers
5. Age-based and skill-based recommendations for educational robots
6. Price comparison, and historical price tracking
7. **Video tutorials** — the gap named in the competitor analysis; no Pakistani
   robotics store (Robo.pk, RoboticPK, IndusRoboTix) has them, and neither does
   a general marketplace like Daraz
8. A robotics-specific AI assistant that explains jargon in plain language

The proposal's target stack is React + FastAPI/Django + PostgreSQL + Docker,
Agile/Scrum, months 3–6 for development. What exists today is a working
prototype of that shape with a rule-based backend — see *Migration path* below.

**[DESIGN.md](DESIGN.md) is the canonical design system.** Read it before
changing any colour, type, or spacing value. It is descriptive of what the app
actually renders, not aspirational.

## Commands

```bash
# UI — port 3000. Next.js 16 (App Router); needs Node 20.9+ and ui/.env
# (copy ui/.env.example) so it talks to the mock server instead of /api.
cd ui && npm ci              # first time only
npm start                    # next dev
npm run build                # next build — also the strictest check we have
npm run serve                # next start, after a build
npm run lint                 # eslint src (eslint-config-next)
npm run lint:fix
npm run format               # prettier
npx tsc --noEmit             # the type check used to verify UI changes

# Mock backend — port 8009, must be running for the UI to show anything
cd mock-server && node server.js

# Scraper
cd scraper && pip install -r requirements.txt
python run.py https://robo.pk              # one site
python run.py --from-config                # every enabled site in config.yaml
python run.py https://robo.pk --limit 10   # fast smoke test
python run.py --images                     # download photos into ui/public/images/
python run.py --from-html saved/page.html  # parse a page saved from your own browser

# Tutorials — separate pipeline, separate entry point. Reads archived
# RobotShop Community pages from the Internet Archive and prices the parts
# they name against data/robots.json, so run the crawl above first.
cd scraper && python run_tutorials.py      # full build -> data/tutorials.json
python run_tutorials.py --limit 5          # fast smoke test
python run_tutorials.py --no-cache         # refetch instead of using .cache_tutorials/

# Scraper tests — 110 offline regression tests, no network
cd scraper && python -m pytest tests -q
python -m pytest tests/test_enrich.py -q                  # one file
python -m pytest tests/test_tutorials.py -q               # the tutorial pipeline
python -m pytest tests/test_enrich.py::test_name -q       # one test
```

There are no UI tests. `npx tsc --noEmit`, a clean `npm run build`, `npm run
lint` with no errors, and a clean browser console are the current bar. Lint
reports ~40 warnings in the upstream NVIDIA chat code (`any` payloads, setState
in fetch effects); those rules are set to `warn` in `eslint.config.mjs` on
purpose — do not add to them, and do not silence them.

## Architecture

Three independent parts joined by one file on disk:

```
scraper/  (Python)  ──> scraper/data/robots.json ──> mock-server/  (Node) ──HTTP──> ui/  (React)
  crawl + enrich          3,269 listings,              loadRobots() groups by       2,880 products
  no LLM, rules only      2,880 unique products        match_key, serves JSON       behind facets

run_tutorials.py    ──> scraper/data/tutorials.json ─────────^                      /tutorials
  Internet Archive        87 tutorials, 68 with        loadTutorials(), served      86 cards +
  -> parse -> price       a priced parts list          whole at GET /tutorials      one featured
```

The tutorial pipeline **reads `robots.json`**, so a product crawl has to exist
before it can price anything. That is its only dependency on the other pipeline;
the two share the keyword matcher in `enrich.py` and nothing else.

`scraper/data/` is **gitignored** (~54 MB, rebuilt by a crawl). The mock server
reads `scraper/data/robots.json` at boot via `CATALOGUE_PATH` in
[mock-server/server.js](mock-server/server.js) — if that file is missing, the
server will not start. `mock-server/robots.json` and `products.csv` are a
hand-authored demo fallback that nothing reads any more.

### The data contract

[scraper/robotshop/models.py](scraper/robotshop/models.py) is the canonical
schema, and its docstring maps each field group onto a proposal objective. One
`Robot` row = one product on one site. The same product on three sites is three
rows sharing a **`match_key`** — that key is the whole basis of price
comparison, and `loadRobots()` in the mock server collapses rows by it into one
card with a seller count.

Two field groups need care:

- **Deliberately empty**: `tutorial_videos`, `documentation_links`,
  `community_links`, `getting_started_guide`, `editor_notes`, `seller_verified`.
  The source sites do not carry them. The schema holds them, the UI hides the
  badge or line when they are absent rather than inventing a value, and **a
  re-crawl must never overwrite them** — scraping must not destroy editorial work.
- **Derived, not scraped**: category, brand, model number, platforms, OS,
  languages, ROS support, skill level, age range, use case, `match_key`. Vendors
  do not state these. All of it is rule-based inference in
  [scraper/robotshop/enrich.py](scraper/robotshop/enrich.py).

### Scraper

`run.py` → adapter (auto-detected) → deep crawl → `parse_specs` → `enrich` →
`store` (SQLite upsert + price history) → `export` (JSON/CSV/UI catalog/report).
Adapters in [scraper/robotshop/adapters/](scraper/robotshop/adapters/) are picked
cheapest-first: Shopify `/products.json` → WooCommerce Store API → Magento
`/graphql` → sitemap (brochure sites) → crawl4ai BFS over headless Chromium.
Adding a site means appending a module there and a block to `config.yaml`;
nothing else changes.

Three standing rules, each explained at length in [scraper/README.md](scraper/README.md):

- **No LLM in extraction.** crawl4ai's `LLMExtractionStrategy` is deliberately
  unused. Vendor descriptions are strict `label: value` lists, so regex reads
  them with full precision, for free, and cannot hallucinate a voltage.
- **Politeness is a constraint, not a setting.** 1 req/s, honest User-Agent with
  a contact address, public catalogue pages only. `robotshop.com` sits behind
  Cloudflare and refuses even `/robots.txt`; crawl4ai's `UndetectedAdapter` is
  intentionally **not** wired in. Use `--from-html` on a page saved from a real
  browser instead.
- **Every test is a shipped defect.** `"ros"` matching inside *gyroscope*,
  `"ble"` inside *addressable*, `HC-SR04` truncated to `SR04`. Fix bugs by adding
  the case to `tests/`, not by patching around it.

### Tutorial pipeline

[scraper/run_tutorials.py](scraper/run_tutorials.py) → CDX index → archived page
→ `parse` → `enrich` → `bom` → `export`. Package:
[scraper/robotshop/tutorials/](scraper/robotshop/tutorials/). This closes
proposal objective 7 with real content instead of placeholders.

- **The source is the Internet Archive, not RobotShop.**
  `community.robotshop.com` sits behind the same Cloudflare bot management as
  the main site and answers this scraper, a headless browser *and*
  `/robots.txt` itself with HTTP 403. So the pipeline never touches their
  servers. It reads public Archive snapshots, keeps metadata and a link, cites
  the snapshot in `archivedUrl`, and links every tutorial back to the original.
  Do not point this at the live site, and do not wire in `UndetectedAdapter`.
- **Thumbnails must be resolved, not constructed.** Their image host 403s too,
  so `image` holds an Archive `im_` URL. Only ~223 of the thumbnails were ever
  captured, which resolves for 81 of 87 tutorials; the rest carry `""` and the
  card renders a "No photo" tile. Never emit a URL you have not found in the
  CDX index — it renders as a broken image.
- **Facts vs inference.** Title, summary, author and dates come from the page's
  JSON-LD `Article` block, unedited. Category, level, platforms, format and the
  parts list are ours, derived by rules.
- **The parts list is the product's argument, and the easiest thing to get
  wrong.** Four classes of bug are already fixed and commented in
  [bom.py](scraper/robotshop/tutorials/bom.py) and
  [parse.py](scraper/robotshop/tutorials/parse.py): a series table of contents
  read as body text (a potentiometer lesson needing a servo and an IMU), a
  token matched as a substring so `"resistor"` hit *photoresistor*, a metaphor
  counted as a component (a water wheel in an inductors lesson), and generic
  terms matched on a single passing mention. Same rule as the crawler: **every
  test is a shipped defect** — add the case, do not patch around it.

### Mock server

[mock-server/server.js](mock-server/server.js) — ~780 lines, Node built-ins only,
no dependencies. It stands in for the NVIDIA blueprint backend (which needs
Docker and 4×H100 GPUs) and speaks the same wire protocol:

| Route | Purpose |
|---|---|
| `POST /query/stream` | SSE: `data: {json}` lines of `content` / `products` / `images`, then `data: [DONE]` |
| `POST /query` | The same answer as one JSON body |
| `GET /catalog` | Paginated browse plus facet counts; multi-select params repeat |
| `GET /tutorials` | `{count, tutorials}` — the whole library, unpaginated. Empty until `run_tutorials.py` has run; a missing `tutorials.json` is a warning, not a fatal error like a missing `robots.json` |
| `GET /health` | `{status, robots, tutorials}` |

`buildReply()` is a **rule-based implementation of the blueprint's agent
architecture**: intent regexes (cart add, compare, tutorials, explain, greeting)
are the planner, `parseFilters()` + `searchRobots()` are the retriever, a
glossary is the explainer, an in-memory `Map` of carts is the memory layer. This
is intentional — see *Migration path*.

`RATE_TO_PKR` is a hard-coded USD→PKR rate used **only** to put PKR and USD
listings on one axis for filtering and sorting; prices always display in the
currency the seller quoted. Move conversion into the scraper before anyone
treats a converted total as accurate.

### UI

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind, with MUI used
for its icons only. The code is NVIDIA's
[Retail Shopping Assistant](https://github.com/NVIDIA-AI-Blueprints/retail-shopping-assistant)
blueprint UI under Apache 2.0 — keep the SPDX headers on the files that carry
them. It was moved off Create React App in September 2026; the design record is
[docs/superpowers/specs/2026-09-19-nextjs-migration-design.md](docs/superpowers/specs/2026-09-19-nextjs-migration-design.md).

| Route | File | Screen |
|---|---|---|
| `/` | `src/app/page.tsx` | Catalogue, unfiltered — the front door |
| `/catalog` | `src/app/catalog/page.tsx` | The same page, so the URL says what it is |
| `/catalog/[category]` | `src/app/catalog/[category]/page.tsx` | Catalogue with a category preset; the navbar strip links here |
| `/tutorials` | `src/app/tutorials/page.tsx` | Tutorials |
| `/community` | `src/app/community/page.tsx` | Community reviews — tag a catalogue product, score it, say what board you tested it on |
| `/assistant` | `src/app/assistant/page.tsx` | The original chat-led screen: full-height panel beside the splash image |

`src/app/layout.tsx` is the only server component: the document shell, fonts,
`Navbar`, and `src/app/providers.tsx` (toast outlet plus the
`RenderImageContext` that lets either chat surface set the image `/assistant`
displays). Every page file and everything under `components/` is `"use
client"`; the app is client-rendered exactly as it was, just served by Next.

Things that are easy to break:

- **Every page is statically prerendered at build time**, which means the
  first render runs in Node. Reading `window`/`localStorage` during render
  breaks the build or causes a hydration mismatch — read them in effects, as
  `reviewStore.ts` callers already do. Anything calling `useSearchParams` must
  sit under a `<Suspense>` boundary (`CatalogScreen.tsx` provides it).

- **Filter state lives entirely in the query string**, so a filtered view is a
  shareable link and the back button works. Keep it there —
  [ui/src/hooks/useCatalog.ts](ui/src/hooks/useCatalog.ts) fetches `GET /catalog`
  for the current query string.
- **`chatbox.css` is untouched upstream styling.** The catalogue reframes the
  same `Chatbox` component into a corner launcher via `.chat-widget` in
  `catalog.css`, so `/assistant` still renders exactly as before. Do not fix one
  screen by editing the other's CSS.
- **`[ref]` comments in [ui/src/catalog.css](ui/src/catalog.css)** mark computed
  values measured off thepihut.com at a 1440px viewport. They are a reference to
  match, not arbitrary numbers. Two deliberate departures from DESIGN.md live
  there and are annotated inline.
- **Brand name, assistant name, categories, API base URL, and feature flags** are
  all in [ui/src/config/config.ts](ui/src/config/config.ts). Change them there and
  nowhere else. The navbar categories mirror the scraper's taxonomy in `enrich.py`.
  The API base URL comes from `NEXT_PUBLIC_API_BASE_URL` in `ui/.env`
  (gitignored; copy `.env.example`) and falls back to `/api` for the Docker
  nginx proxy.
- **Tutorials are real and are not ours.** The page fetches `GET /tutorials` via
  [ui/src/hooks/useTutorials.ts](ui/src/hooks/useTutorials.ts); the old
  hand-written `ui/src/data/tutorials.ts` is gone. Every tutorial was written by
  someone on RobotShop's community site, so the title links out, the byline is
  on every card, and the parts table is headed *"Parts this tutorial mentions"*
  — not *"What you need"*. That wording is load-bearing: a lesson comparing
  three microcontrollers names all three, and a total that sums them describes
  a purchase nobody would make. Do not tighten it back up.
- **[ui/src/data/reviewStore.ts](ui/src/data/reviewStore.ts) is the only file that
  knows community reviews live in `localStorage`.** Every function is `async`
  even though nothing awaits, so the move to Supabase rewrites that one file and
  no caller changes shape; the target table is written out in its header
  comment. Two things stay device-local either way — which reviews this browser
  voted helpful, and which it wrote (there is no sign-in, so "your own" means
  "written here"). The tagged product is **denormalised into every review on
  purpose**: product ids are not stable across crawls, so a review holding only
  an id would lose its subject the first time the scraper ran.
- **The community page shares no code with tutorials.** `CommunityRail` is a
  deliberate sibling of `tutorials/FilterRail`, and `community.css` redeclares
  the tokens rather than importing `tutorials.css`. Sharing either would mean
  editing one screen to serve the other. Two pages with a checkbox list is a
  coincidence; lift a shared rail when a third one needs it.
- Guardrails are **not disabled** — only the on-screen toggle was removed. The
  value still comes from `config.features.guardrails.defaultState` and is still
  sent on every request.
- The app **no longer runs offline**: none of the 2,880 current products carry a
  `local_path`, so images resolve to remote supplier URLs. Re-run the scraper
  with `--images` to restore local copies. `ProductCard` degrades to a labelled
  "No photo" tile rather than a broken image.

## Migration path

The mock server is a scaffold, not the answer.
[docs/AGENT-ARCHITECTURE-REVIEW.md](docs/AGENT-ARCHITECTURE-REVIEW.md) is the
plan of record: **copy the blueprint's architecture, not its infrastructure** —
planner → specialist → grounded responder, memory in PostgreSQL, LLM output
validated by ordinary code before it reaches the database. Explicitly dropped:
GPUs and self-hosted NIMs, Milvus/etcd/MinIO (use `pgvector`), the NeMo
Guardrails container, image search. The migration is to replace the regex rules
in `buildReply()` one at a time with model calls, keeping the `/query/stream` SSE
contract so `ui/` never changes.

For robots, **SQL is the authority and embeddings are the ranker** — similarity
search alone cannot answer "which robots support ROS 2".

[docs/PAGES.md](docs/PAGES.md) is the page roadmap, ordered by what the scraped
data can actually support. Product detail is next; price history, tutorials, and
seller profiles are blocked on data rather than on UI. The chat ↔ filter wiring
named there as the feature neither a plain catalogue nor a plain chatbot can
offer is still unbuilt, and both halves are ready for it.

## Honesty about coverage

Several proposal features are visibly unpopulated, and the app says so rather
than faking it: `ros_support` is false throughout, so a ROS query explains that
the crawl covers a limited set of stores instead of returning an empty result;
only 62 products are listed on more than one site, so most comparisons are
spec-vs-spec rather than price-vs-price; price history needs repeat crawls before
it shows anything. When adding a feature, follow the same rule — an empty state
names what happened and what to do next (DESIGN.md §8).

The tutorial library follows it too, and the numbers are worth knowing before
you "fix" one of them:

| What | Coverage | Why |
|---|---|---|
| Tutorials indexed | 87 | Every archived `/tutorials/show/` page |
| With a parts list | 68 | The other 19 name nothing we stock, and say so on the card |
| With a thumbnail | 81 | The Archive never captured the other 6 |
| `runtimeSec` | 0 | The archived pages carry no video duration. The series name "Arduino 5 Minute Tutorials" is a claim about a series, not this lesson — do not launder it into a number |
| `verifiedBuild` | 0 | It means "we built this and checked it". Nothing scraped has earned it |

Coverage was deliberately traded for accuracy once already: requiring two
mentions before a generic part counts dropped priced tutorials from 76 to 68 and
removed a Rs 600 robot wheel from a lesson about inductors. If a change raises
the first number, check what it did to the second.

## Other agent configs

`~/.codex` and `~/.gemini` exist on this machine. Reply `/import` to scan and
list what is importable (MCP servers, slash commands, subagents, skills,
instructions), then `/import --yes=<digest>` with the digest from that scan to
apply the user-level items. If `/import` is unavailable on this surface, run
`claude import` from a terminal instead.
