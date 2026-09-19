# Vercel-style catalogue preview

**Status:** preview, on branch `vercel-preview`. Not merged. Decides nothing
until someone has looked at it with real data.

## Why

The current design system (DESIGN.md) is thepihut's catalogue geometry with
NVIDIA's green accent and an amber data accent. The candidate replacement is
Vercel's system: an achromatic, hairline-bordered, mono-labelled interface
that reads like a typeset terminal. Before deciding, restyle one page and look.

The catalogue is the page to test on. It is the front door and it touches the
most components — navbar, filter sidebar, result bar, product cards,
pagination, chat launcher — so if the style holds there it holds anywhere.

## Scope

Three files change. No component logic, no server, no DESIGN.md.

| File | Change |
|---|---|
| `ui/src/app/layout.tsx` | Add Geist Sans and Geist Mono to the Google Fonts link. Lato and Plex stay loaded for the other pages. |
| `ui/src/components/Navbar.tsx` | One 64px bar on `#fafafa` with a hairline bottom border. Wordmark, category links, Tutorials/Community pushed right. Categories render in sentence case. No hamburger icon, no grey strip. |
| `ui/src/catalog.css` | Every token, type and spacing value moves to the Vercel system. The `[ref]` comments (thepihut measurements) go, because the reference has changed. |

The navbar is shared, so every page gets the new bar during the preview. The
other pages still assume a 106px bar (`calc(100vh - 106px)`), so they run 42px
short of the viewport bottom until they are restyled too. That is a known
cost of the preview, not a bug to fix here.

## Mapping

Vercel token → where it lands on the catalogue.

**Colour.** Page canvas `#fafafa`. Cards `#ffffff` with the stacked-ring
border (`0 0 0 1px rgba(0,0,0,0.08), 0 0 0 2px #fafafa`), no shadow, no hover
lift. Text `#171717` / `#4d4d4d` / `#666666`. Rules `#ebebeb`. Checkbox
accent `#171717`. **No green anywhere on this page.** Price is `#171717`.

**Type.** Geist Sans for reading; Geist Mono, 11–13px, uppercase, `0.071em`
tracking for every label, eyebrow, count, and figure. This keeps DESIGN.md's
mono-for-numbers rule and extends it to labels, which is Vercel's rule.

| Element | Setting |
|---|---|
| Breadcrumb | Mono 12px, `#666` |
| Page title | Sans 30px / 400 / `-1.5px` tracking / line-height 1.1 |
| "Showing 1–48 of 2,880" | Sans 14px `#4d4d4d`, figures in mono |
| Sort label | Mono 11px eyebrow |
| Facet heading | Mono 11px eyebrow, `#171717` |
| Facet option | Sans 14px `#4d4d4d`; count in mono 12px `#8f8f8f` |
| Card brand | Mono 11px eyebrow, `#666` |
| Card name | Sans 14px / 500 / 1.43, two-line clamp |
| Card meta | Sans 13px `#666` |
| Card price | Mono 14px / 500 `#171717` |
| Seller count | Mono 11px `#8f8f8f` |
| Out of stock | Mono 11px uppercase, hairline pill, `#666` on `#fafafa` |
| Pagination | Mono 13px |

**Buttons.** Ghost outline (transparent, `#4d4d4d`, 1px `#ebebeb` ring, 6px
radius) for "View at seller", "Clear all filters", and inactive page numbers.
On hover the ghost inverts to filled `#171717` / white. Filled `#171717` for
the current page number and the chat launcher (as a 9999px pill).

**Layout.** Max-width 1280px, 24px gutters. Sidebar 240px, 40px gap. Sidebar
has no panel: facets are separated by hairline rules. Grid is
`repeat(auto-fill, minmax(200px, 1fr))` with 16px gaps, so the fixed 183px
tracks go. Section gaps stay compact — this is a catalogue, not a landing page,
and DESIGN.md's page-header rule (first card above the fold at 1440×900)
still applies.

## What stays the same

Filter state in the query string. The `useCatalog` hook. `ProductCard`,
`FilterSidebar` and `Catalog` markup. The chat widget's geometry overrides
(they re-frame `chatbox.css`, which is untouched upstream). Skeleton and empty
states keep their copy; they change colour only.

## Known tensions if adopted app-wide

- DESIGN.md's verified green `#1B9E5A` and amber tutorial-count accent are both
  chromatic and both banned. Neither appears on the catalogue card today, so
  the preview avoids the question. App-wide, the verified badge becomes a mono
  `✓ VERIFIED` stamp in Terminal Green `#297a3a` (Vercel's one permitted
  chromatic accent) and amber goes.
- DESIGN.md is descriptive of what the app renders. If this is adopted it gets
  rewritten after the pages change, not before.

## Done when

`npx tsc --noEmit`, `npm run build` and `npm run lint` are clean, the browser
console is clean, and a screenshot of `/` at 1440×900 shows the first row of
cards above the fold.
