# What to build next

Which pages the app still needs, ordered by value against what the scraped data
can actually support today. Measured on `scraper/data/robots.json`:
**3,269 listings → 2,880 unique products, across 5 sites.**

---

## The architectural decision first

There is no router. `App.tsx` renders one screen: navbar, a static left pane,
and a fixed chat panel. Two ways to add pages:

**A. Left pane becomes the page surface.** The chat stays docked on the right at
all times; the left 40% becomes the navigable area. Browse, detail, and compare
are all views of that pane.

**B. Conventional multi-page app.** Real routes, full-width pages, chat demoted
to a floating widget.

**Recommend A.** The assistant is the differentiator named in the proposal — the
thing no Pakistani competitor has. Option B buries it behind a button and the app
becomes an ordinary catalogue with a chatbot bolted on. Option A keeps the
conversation beside the content, so the assistant can drive the left pane
("show me the cheapest one" → the pane changes), which is a genuinely better
product than either half alone.

It also costs less: the left pane is currently dead space, so nothing is lost.
Add `react-router-dom` and route only that pane.

---

## Readiness

| Page | Value | Data ready? | Notes |
|---|---|---|---|
| 1. Browse / catalogue | **Critical** | ✅ Yes | 2,880 products are currently reachable *only* by chatting |
| 2. Product detail | **High** | ✅ Yes | description 97%, specs_raw 72%, features 56% |
| 3. Compare | **High** | ⚠️ Partly | Only 62 products are sold on more than one site |
| 4. Category pages | Medium | ✅ Yes | Navbar links are dead `#` today; ~free once browse exists |
| 5. Cart / shortlist | Medium | ✅ Yes | Server already tracks a cart — there is no UI for it |
| 6. Price history | Medium | ❌ No | 1 price point per product; needs repeat crawls |
| 7. Tutorials / learn | **High** | ❌ No | 0% populated — your stated differentiator |
| 8. Seller profiles | Low | ❌ No | `seller_verified` null across all 3,269 |

---

## 1. Browse / catalogue — build this first

Chat is a bad way to explore 2,880 products. You cannot skim, and you cannot see
what exists without knowing to ask for it.

```
┌──────────────┬──────────────────────────────┐
│ FILTERS      │  2,880 products              │
│              │  ┌──────┐ ┌──────┐ ┌──────┐  │
│ Category     │  │ card │ │ card │ │ card │  │
│  Sensors 616 │  └──────┘ └──────┘ └──────┘  │
│  Proto   871 │  ┌──────┐ ┌──────┐ ┌──────┐  │
│              │  │ card │ │ card │ │ card │  │
│ Price        │  └──────┘ └──────┘ └──────┘  │
│  ──○────○──  │                              │
│ Platform     │                              │
│  Arduino     │                              │
│ Skill        │                              │
│ ☐ In stock   │                              │
└──────────────┴──────────────────────────────┘
```

Reuse `.robot-card` exactly as it is. Filter facets that have real coverage:
category (96%), price (96%), platform, skill, in-stock (99%).

**Wire the filters to the assistant.** The parser in `server.js` already turns
"beginner Arduino sensors under Rs 500" into a filter object — have it set the
browse filters, and have manual filter changes appear as chat context. That is
the feature neither a plain catalogue nor a plain chatbot can offer.

## 2. Product detail

Everything the card omits. Data coverage is good:

| Section | Source | Coverage |
|---|---|---|
| Gallery | `images` | 2.1 per product |
| Description | `description_text` | 97% |
| Key features | `features` | 56% |
| Full spec table | `specs_raw` | 72%, avg 7.1 rows |
| Compatibility | platforms / languages / OS | ~40% |
| Sellers | `sellers[]` | 100% |
| Buy | `source_url` | 100% |

Render `specs_raw` verbatim as a two-column table — it is deliberately lossless
in `models.py`, so it shows real vendor labels even where normalisation failed.

## 3. Compare

The proposal's objective 3, and nobody local has it. Two or three products, one
spec per row, differences highlighted.

Be honest about the limit: only **62 products** are currently listed on more than
one site, so most comparisons are spec-vs-spec rather than price-vs-price. That
number grows with every site added to `config.yaml`.

## 4–5. Category pages and cart

Both are cheap once browse exists. Category pages are browse with a preset
filter, and the navbar links are dead `#` today. The cart already exists
server-side (`carts` in `server.js`) with no UI.

## 6–8. Blocked on data, not on UI

- **Price history** needs repeat crawls. One scheduled re-run per week starts
  accumulating `price_history` immediately — worth starting now, since the data
  only becomes useful after weeks of collection.
- **Tutorials** are 0% and deliberately not scraped. `models.py` calls this an
  editorial pass. Since it is your headline gap, it needs a plan: even 20
  products with 3 curated links each would demo it.
- **Verified sellers** needs a rule for what "verified" means. Right now nothing
  populates it, so the badge never shows.

---

## Data hygiene worth fixing alongside

| Issue | Detail |
|---|---|
| Currency | `shop.unitree.com` quotes USD, the other four PKR. The UI now shows native currency and converts only for sorting, using a hard-coded `RATE_TO_PKR` in `server.js`. Move this into the scraper. |
| Uncategorised | 140 listings have no category, so they are invisible to category filters. |
| Watermarks | Some supplier photos carry vendor watermarks — avoid those for hero imagery. |
| `stock_qty` | 0% populated, though `in_stock` is 99%. |

---

## Suggested order

1. Router + left pane as the page surface
2. Browse with filters
3. Product detail
4. Category pages and cart (nearly free by then)
5. Compare
6. Start weekly crawls so price history has something to show later
