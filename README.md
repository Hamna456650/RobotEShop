# Servo — robotics parts advisor

> **Design system:** [DESIGN.md](DESIGN.md) is the canonical reference for
> colour, typography, and spacing. Read it before changing any visual value,
> and use it to keep other apps consistent.

A chat-led front end for browsing robotics parts, comparing prices across
sellers, and having the technical terms explained in plain language.

The layout began as the UI from the
[NVIDIA AI Blueprint: Retail Shopping Assistant](https://github.com/NVIDIA-AI-Blueprints/retail-shopping-assistant).
Its real backend needs Docker, an NVIDIA NGC account, and 4x H100/A100 GPUs, so
it is replaced here by a small mock server that speaks the same wire protocol
and reads the catalogue your own scraper produces.

Brand name, assistant name, and the category strip all live in one place:
[`ui/src/config/config.ts`](ui/src/config/config.ts).

## Run it

Two terminals.

**Terminal 1 — mock backend** (port 8009):

```bash
cd mock-server
node server.js
```

**Terminal 2 — UI** (port 3000):

```bash
cd ui
npm start
```

Then open <http://localhost:3000>.

First-time only, install the UI dependencies with `cd ui && npm ci`.

## What works

- Streaming chat replies, rendered token by token exactly like the real backend
- Robot search over the 36-item catalogue, with filters parsed from plain language
- **Robot spec cards** showing verified seller, age and skill fit, platform and
  ROS support, local price, seller count, and tutorial coverage
- Side-by-side comparison, cart add/remove with toasts, and a plain-language
  glossary for ROS, DOF, payload, lidar, SLAM, servos, and SDKs
- Image upload, which triggers a mock visual search
- The reset button (the circled X beside the input)

Things to try in the chat:

- `I need a robot to teach 12-year-olds to code`
- `Show me robotic arms under Rs 500,000`
- `Which robots support ROS 2?`
- `Compare TurtleBot3 Burger and JetBot`
- `What does 6-axis mean?`
- `Add it to my cart`

## Changes made to the upstream UI

The blueprint's CSS assumes a very tall screen — NVIDIA's own screenshot is a
~1230px viewport. On a laptop the fixed chrome ate two thirds of the chat panel.
These changes keep the original look on big screens and fix it on small ones.

Measured at a 587px-tall viewport, the conversation area went from **143px (34%
of the panel) to 359px (75%)** — the same proportion as NVIDIA's screenshot.

### Chrome removed to make room for the conversation

| Removed | Reclaimed |
|---|---|
| Page footer (Contact us / Guidelines & FAQ / Privacy policy), and `.chatbox { bottom }` 64px → 0 | 64px |
| "Powered by NVIDIA" strip | ~46px |
| Guardrails toggle | ~38px |

Guardrails are **not disabled** — only the on-screen switch is gone. The value
still comes from `config.features.guardrails.defaultState` and is still sent on
every request, so restoring the toggle is a UI-only change. Removing the MUI
`Switch`/`FormControlLabel` also dropped the console warnings from 6 to 1.

### Layout and polish fixes

| Change | Why |
|---|---|
| Chat auto-scroll now sets `scrollTop = 0` on the column-reverse list | It called `scrollIntoView({ block: "start" })`, which pinned the message's *top* to the top of the list and left its bottom cut off mid-line behind the input |
| Header 80px → 52px, input padding 20px → 12px, dropped a dead 20px margin | Trimmed the remaining fixed chrome |
| `overflow-y: scroll` → `auto`, slim styled scrollbar | `scroll` reserved a permanent native Windows scrollbar with arrow buttons |
| Removed `scrollbar-color: red` | Invalid — the property needs two colours, so it did nothing |
| Product cards given a uniform 158px width and cropped thumbnails | Cards were sized by each photo's aspect ratio (165/186/252/170px), which looked ragged |
| Card image height `340px` → `min(200px, 24vh)` | A 340px card was taller than the whole message area on a laptop |
| Fixed-height card caption with a 2-line clamp | Long names wrapped and left card bottoms uneven |
| Left pane sized to `calc(100vh - 106px)` with `object-fit: cover` | The image overflowed its box and left a gap below it; it now lines up with the chat panel |
| Focus ring on the message input | No focus feedback at all before |
| Mock server drops products with no image file | The dev server answers unknown `/images/*` with the SPA index.html instead of a 404, so a missing file renders as a broken image. One upstream row (`Kaleidoscope Floral Maxi Skirt`) hits this |

Verified with `npx tsc --noEmit` (clean) and no new console errors — the six MUI
PropTypes warnings are upstream's and were there before.

## Layout

```
ui/                    React 18 + TypeScript + Tailwind + MUI (Create React App)
  src/components/      Navbar, Apparel (splash image), chatbox/
  src/config/config.ts API base URL, categories, feature flags
  public/images/robots/ 36 generated placeholder SVGs
  .env                 Points the UI at the mock server
mock-server/
  server.js            Dependency-free stand-in for the chain server
  robots.json          36-robot catalogue with specs, sellers, tutorials
  generate-placeholders.js  Regenerates the placeholder artwork
docs/
  UI-CUSTOMISATION-IDEAS.md  Design direction, derived from the FYDP proposal
```

## The catalogue

The server reads **`scraper/data/robots.json`** — the real output of
`scraper/run.py`, currently 144 listings from Robo.pk. Listings are grouped by
`match_key`, so the same product sold on several sites collapses to one card
with a seller count: **135 unique products**.

Field mapping lives in `loadRobots()` in `mock-server/server.js`, against the
canonical model in [`scraper/robotshop/models.py`](scraper/robotshop/models.py).

Two fields the scraper does not yet populate, so the UI hides them rather than
inventing values:

| Field | Status |
|---|---|
| `seller_verified` | null for all 144 — no verified badge is shown |
| `tutorial_videos` | empty for all 144 — no tutorial line is shown |

Both render automatically as soon as the scraper or an editorial pass fills
them. `ros_support` is false throughout, so ROS chips do not currently appear
and a ROS query explains why rather than returning an empty result.

`mock-server/robots.json` and `generate-placeholders.js` are a hand-authored
demo catalogue kept only as a fallback; nothing reads them now.

The assistant understands structured constraints in plain language and says which
ones it applied:

| Ask | Understood as |
|---|---|
| "show me motion sensors under Rs 500" | category + max price |
| "what works with ESP32?" | platform filter |
| "beginner parts for a first Arduino build" | platform + skill |
| "parts for a 12-year-old" | age 12 must fall inside the product's range |
| "what does I2C mean?" | glossary answer, no product cards |

### Product images

All 144 photos are already downloaded to `ui/public/images/`, so the app runs
offline. The scraper writes them there via `image_dir` in `scraper/config.yaml`.

Note that some supplier photos carry vendor watermarks — worth filtering on when
you pick imagery for anything prominent.

## Where to customise for a robot shop

- `ui/src/components/Navbar.tsx` — brand name ("Avanzare") and the category strip
- `ui/src/components/chatbox/chatbox.tsx` — panel heading and the welcome message
- `ui/src/config/config.ts` — category labels, splash image, feature flags
- `ui/src/chatbox.css` — chat panel styling, including the NVIDIA green accent
- `mock-server/products.csv` — swap in robot products
- `ui/public/images/` — swap in robot product images

## Licence

The UI source and product assets are NVIDIA's, under Apache 2.0 — see
`ui/` file headers and the upstream `LICENSE` / `LICENSE-assets.txt`.
