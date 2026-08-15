# Design system

The visual language of this app, written down so other apps can match it.

Everything here is **descriptive, not aspirational** — these are the values the
running app actually uses. Where a value is listed twice in the source under
different casing (`#76B900` and `#76b900`), the canonical form is given here.

---

## 1. Colour

Two accents with strict, separate jobs. This is the part that most often goes
wrong when a system is copied: do not let them drift into decoration.

### Brand accent — green

Used for interactive affordances: send, reset, upload, focus rings, the user's
own message bubble.

| Token | Value | Use |
|---|---|---|
| `--primary` | `#76B900` | Action icons, focus ring, active controls |
| Bubble tint | `rgba(118, 185, 0, 0.3)` | User message bubble background |
| Focus ring | `rgba(118, 185, 0, 0.15)` | 3px ring on the focused input |

### Data accent — amber

Used only on the data surfaces (product cards): the skill chip and the
tutorial count. **Never** used for buttons or navigation — if amber becomes
clickable, the two accents stop meaning anything.

| Token | Value | Use |
|---|---|---|
| Signal | `#FF8A00` | Tutorial count, card emphasis |
| Skill chip fill | `rgba(255, 138, 0, 0.1)` | Skill chip background |
| Skill chip border | `rgba(255, 138, 0, 0.35)` | Skill chip border |
| Skill chip text | `#9A5200` | Darkened for contrast on the tint |

### Semantic

| Token | Value | Use |
|---|---|---|
| Verified | `#1B9E5A` | Verified-seller badge — this colour means *verified* and nothing else |

### Neutrals

| Token | Value | Use |
|---|---|---|
| Ink | `#101826` | Card headings, spec values |
| Body | `#121212` | Assistant message text |
| Slate | `#5A6678` | Card secondary text, chip labels |
| Muted | `#666666` | Inactive nav categories |
| Strong | `#202020` | Brand wordmark, nav text |
| Heading | `#292929` | Panel heading |
| Rule | `#D8DEE7` | Card borders, internal card rules |
| Hairline | `#ECECEC` | Panel header and footer dividers |
| Field border | `#D8D8D8` | Input border (unfocused) |
| Scroll thumb | `#CFCFCF` | Scrollbars, `#B0B0B0` on hover |

### Surfaces

| Token | Value | Use |
|---|---|---|
| White | `#FFFFFF` | Cards, assistant bubbles, header, input bar |
| Panel | `#F9F9F9` | Chat panel ground |
| Card media | `#F7F8FA` | Product image backdrop |
| Nav bar | `#F2F2F2` | Category strip |

**Rule of thumb:** white is content, `#F9F9F9` is the surface content sits on,
`#F2F2F2` is chrome.

---

## 2. Typography

Three roles. The third is what makes the product surfaces read as technical
rather than as retail — do not skip it.

| Role | Stack | Where |
|---|---|---|
| UI | `"NVIDIA Sans", sans-serif` | Everything by default |
| Body | system stack on `body` | Fallback outside the chat panel |
| **Data** | `"IBM Plex Mono", ui-monospace, "SFMono-Regular", Consolas, monospace` | **All numerals**: prices, chips, badges, part codes |

> Every number a user compares — a price, a spec value, a part code — is set in
> mono. Monospaced figures align in a column, which is the whole point when the
> job is comparison.

**Load IBM Plex Mono, and name it first.** The stack originally led with
`ui-monospace`, which on Windows resolves to Consolas — so every figure in the
app was silently set in the system code-editor face while the CSS claimed
otherwise. Plex is loaded in `ui/public/index.html`. If you copy this system,
copy the webfont link too, or the stack is decorative.

Figures are ranked, not uniform. A price a decision turns on, a line cost, and
a bookkeeping count are three different kinds of fact and are set at three
sizes — see the `FIGURES` block in `ui/src/tutorials.css`. Setting them all at
one size is what makes a data surface read as machine output.

The currency is a mark on the amount, not part of it: `Rs` is set at `0.62em`,
weight 500, in slate, so the digits carry the price.

### Scale

| Element | Size | Weight | Line height |
|---|---|---|---|
| Brand wordmark | 22px | 700 | — |
| Panel heading | 20px | 500 | — |
| Nav categories | 15px | 500 | — |
| Welcome text | 14px | 400 | — |
| Message body | 1rem | 400 | 1.6 |
| Card name | 0.82rem | 700 | 1.25 |
| Card price | 0.85rem | 600 | — |
| Card meta | 0.70rem | 400 | 1.3 |
| Card offers | 0.65rem | 400 | — |
| Card tutorials | 0.68rem | 600 | — |
| Chip | 0.60rem | 400 | — uppercase, `0.03em` tracking |
| Verified badge | 0.62rem | 400 | — uppercase, `0.04em` tracking |

Message text is `1rem / 1.6`. Long-form reading gets generous leading; dense
data does not.

---

## 3. Spacing

Roughly a 4px base, but honestly: the values below are what is used. Match
them rather than deriving from a scale.

| Context | Value |
|---|---|
| Panel header height | 52px, `0 20px` |
| Message list padding | `12px 20px` |
| Input bar padding | `12px 20px`, 10px gap |
| Input field padding | `10px 14px` |
| Message bubble padding | `12px 16px` |
| Bubble top margin | 10px |
| Card body padding | `8px 10px 10px` |
| Card body row gap | 5px |
| Card row gap | 10px |
| Chip padding | `2px 6px` |
| Chip gap | 4px |
| Card price rule spacing | 6px above |

**Chrome stays compact so content gets the room.** The fixed furniture in the
chat panel totals ~200px; everything left over goes to the conversation. When
adapting this to another screen, keep that priority — trim the chrome, never
the content area.

---

## 4. Shape and depth

| Property | Value |
|---|---|
| Message bubble radius | 20px, with the corner nearest the speaker squared off |
| Card radius | 10px |
| Card media | square top, clipped by `overflow: hidden` |
| Chip radius | 4px |
| Input radius | 15px |
| Card border | `1px solid #D8DEE7` |
| Card shadow | `0 1px 3px rgba(16, 24, 38, 0.08)` |
| Bubble shadow | `0 1px 2px rgba(0, 0, 0, 0.06)` |
| Panel shadow | `0 0 15px rgba(0, 0, 0, 0.1)` |

Conversation is soft (20px, pill-like). Data is tight (10px cards, 4px chips).
The radius tells you which kind of thing you are looking at.

---

## 5. Component patterns

### Message bubbles

Asymmetric radius encodes who is speaking. The assistant squares its
bottom-left, the user squares its bottom-right — the corner points back at the
speaker. Assistant bubbles are white with a hairline shadow; user bubbles are
the green tint with no shadow.

### Product card

Fixed 212px width. Uniform size is the point — a result set should read as a
tidy row, never as ragged columns sized by each photo's aspect ratio.

```
┌────────────────────────────┐
│  [photo]        ✓ VERIFIED │  cover-cropped, min(120px, 15vh)
├────────────────────────────┤
│  Product name              │  0.82rem/700, clamped to 2 lines
│  Category · Ages 14+       │  0.70rem, slate
│  ARDUINO  ESP32  BEGINNER  │  mono chips, uppercase
│  ─────────────────────────  │  1px rule
│  Rs 330          1 seller  │  mono price
│  ▶ 12 tutorials            │  amber
└────────────────────────────┘
```

Two rules that keep a row tidy:

- **Clamp the name to two lines** and give it a `min-height`, so every card's
  price rule lands on the same baseline.
- **Cover-crop the image to a fixed height**, so photos of different
  proportions do not change card height.

Conditional fields degrade quietly: no verified flag means no badge, zero
tutorials means no line. Never render an empty label.

### Card rows scroll sideways

A row of results is `flex-flow: row nowrap` with `overflow-x: auto`, so any
number of results costs exactly one card height. A wrapping grid would push the
conversation off screen, which inverts the priority in section 3.

### Chips

Uppercase mono, `0.6rem`, `2px 6px`, 4px radius, 1px rule border. Neutral by
default; the skill chip is the amber variant. Cap the visible count (three) and
deduplicate before capping.

---

## 6. Scrollbars

Never leave the native Windows scrollbar with its arrow buttons — it is the
fastest way to make a web app look unfinished.

```css
overflow-y: auto;              /* not `scroll` — that reserves a permanent bar */
scrollbar-width: thin;
scrollbar-color: #cfcfcf transparent;
```

```css
::-webkit-scrollbar        { width: 8px; }   /* 6px horizontal */
::-webkit-scrollbar-track  { background: transparent; }
::-webkit-scrollbar-thumb  { background: #cfcfcf; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #b0b0b0; }
```

---

## 7. Responsive behaviour

Vertical space is the scarce resource, so anything tall is capped against the
viewport rather than fixed:

| Element | Rule |
|---|---|
| Card image | `min(120px, 15vh)` |
| Left content pane | `calc(100vh - 106px)` |
| Message list | `flex: 1 1 auto` with `min-height: 0` |

Two gotchas worth carrying to any app that copies this:

1. A flex child that scrolls needs **`min-height: 0`**, or it refuses to shrink.
2. A non-shrinking row inside a flex column needs **`flex: 0 0 auto`**, or it
   collapses to the height of its own scrollbar.

---

## 8. Voice

- Sentence case everywhere. No Title Case On Buttons.
- Say what a control does: "Add to cart", not "Submit".
- Keep the name of an action stable through the flow — "Publish" produces
  "Published".
- Explain jargon in plain words rather than linking away.
- Empty and error states say what happened and what to do next. When the
  catalogue has no ROS products, say that the crawl only covers one site — do
  not say "no results".
- Emoji are allowed, sparingly, as punctuation for a result — never decoration.

---

## 9. Applying this elsewhere

Copy in this order:

1. **Colour roles first.** One brand accent for actions, one data accent for
   information, one semantic colour. Three is the budget.
2. **The mono-for-numbers rule.** Highest ratio of impact to effort.
3. **Spacing and the compact-chrome priority.**
4. **The card pattern**, if the app shows comparable items.

Do not copy the NVIDIA Sans webfont into an unrelated product — it is NVIDIA's
brand asset. Substitute a neutral grotesque and keep everything else.
