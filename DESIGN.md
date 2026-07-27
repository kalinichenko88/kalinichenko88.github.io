---
version: alpha
name: kalinichenko.dev
description: >-
  Content-first editorial personal site. Warm "Terracotta + Slate" palette,
  Gambetta display serif, one accent, two themes (light/dark). Tokens below are
  the LIGHT theme (default); dark-theme values live in the "Themes" section of
  the body. Authoritative source of truth is src/styles/global.css CSS custom
  properties — this file mirrors them for humans and agents.
colors:
  bg: '#f4f2ee'
  bg-subtle: '#ecebe5'
  bg-muted: '#e4e2da'
  surface: '#ffffff'
  text: '#232326'
  text-secondary: '#55555b'
  text-tertiary: '#8a8a90'
  border: '#e2e0da'
  border-subtle: '#eceae4'
  accent: '#c25a34' # bright terracotta — FILLS ONLY (backgrounds, borders, marks)
  accent-hover: '#a94a29'
  accent-text: '#a94a29' # AA-safe accent for SMALL TEXT / links on light bg
  accent-subtle: '#f7ebe4'
typography:
  h1:
    fontFamily: Gambetta
    fontSize: clamp(2rem, 4vw, 2.75rem)
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  h2:
    fontFamily: Gambetta
    fontSize: clamp(1.5rem, 3vw, 1.875rem)
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.02em
  h3:
    fontFamily: Gambetta
    fontSize: clamp(1.125rem, 2vw, 1.375rem)
    fontWeight: 600
    lineHeight: 1.2
  hero-name:
    fontFamily: Gambetta
    fontSize: clamp(2.5rem, 5.5vw, 3.6rem)
    fontWeight: 600
  body:
    fontFamily: DM Sans
    fontSize: 1rem
    lineHeight: 1.65
  prose:
    fontFamily: DM Sans
    fontSize: 1.1875rem # blog post reading body (19px)
    lineHeight: 1.75
  meta:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    letterSpacing: 0.02em
  code:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px # cards
  pill: 9999px # buttons, tags, chips
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  6: 24px
  8: 32px
  12: 48px
  16: 64px
  24: 96px
  32: 128px
components:
  btn-primary:
    backgroundColor: '{colors.accent-text}' # light: white on #a94a29 = 5.7:1 (AA)
    textColor: '#ffffff'
    rounded: '{rounded.pill}'
    padding: 12px 32px
  btn-secondary:
    backgroundColor: transparent
    textColor: '{colors.text}'
    rounded: '{rounded.pill}'
    padding: 12px 32px
  card:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.xl}'
    padding: 24px
  tag:
    backgroundColor: '{colors.bg-subtle}'
    textColor: '{colors.text-secondary}'
    rounded: '{rounded.pill}'
    padding: 4px 12px
  topic:
    textColor: '{colors.accent-text}'
    rounded: '{rounded.pill}'
    padding: 2px 8px
  container-wide:
    width: 1100px
  container-prose:
    width: 680px
---

# kalinichenko.dev — Design System

This is the working design system for the site. Read it before building a new
page, section, or component so new work stays consistent. The **YAML front
matter above is the authoritative token list**; the prose below explains _why_
and _how to apply_ it. The runtime source of truth is
`src/styles/global.css` (CSS custom properties named `--color-*`, `--space-*`,
`--radius-*`, `--container-*`) plus the `astro.config.js` `fonts` config.

## Overview

**Direction: characterful, content-first, editorial.** Warmth and personality
come from a warm palette, an expressive serif display face, and one restrained
interaction — not from gadgetry. Writing is the primary content; the design
gets out of its way without going invisible.

- **Fonts:** Gambetta (display/headings, Fontshare), DM Sans (body, Google),
  JetBrains Mono (code + small mono labels, Google).
- **Two themes:** light (`data-theme="cloud"`) and dark
  (`data-theme="cloud-dark"`), plus `auto` (follows system). **Do not rename
  these ids** — the Giscus comment theme map and stored `localStorage`
  preferences depend on `cloud` / `cloud-dark`.
- **Two width tracks:** a tight reading column (`.container-prose`, ~680px) and
  a wide track (`.container`, ~1100px) used by everything else, including blog
  posts.

## Colors

One accent only: **terracotta**. It appears identically on every section and in
both themes.

**The accent has two tokens — this split is a hard accessibility rule:**

- `--color-accent` (`#c25a34`) is the **bright fill** color. Use it for
  backgrounds, chip fills (via `color-mix`), the hover border on cards, the
  divider mark, and the page spotlight. Never use it for small text on a light
  background (it lands ~3.8:1 and fails WCAG AA).
- `--color-accent-text` (`#a94a29` light / `#e07a52` dark) is the **AA-safe
  text** color. Use it for links, `.topic` chips, tag hover, and any small
  accent-colored text. It passes AA on the page background.

Large display text (card/post title hover in `text-accent`) may use the bright
accent — large text only needs 3:1.

### Themes

Theme values are swapped via CSS custom properties under
`[data-theme='...']` in `global.css`. Dark-theme equivalents:

| token          | light     | dark      |
| -------------- | --------- | --------- |
| bg             | `#f4f2ee` | `#1a1a1c` |
| bg-subtle      | `#ecebe5` | `#202022` |
| surface        | `#ffffff` | `#232326` |
| text           | `#232326` | `#ececed` |
| text-secondary | `#55555b` | `#a6a6ac` |
| text-tertiary  | `#8a8a90` | `#737379` |
| border         | `#e2e0da` | `#313135` |
| accent (fill)  | `#c25a34` | `#e07a52` |
| accent-text    | `#a94a29` | `#e07a52` |

Dark primary buttons use **dark text** (`var(--color-bg)`) on the accent fill
for AA; light primary buttons use white on `--color-accent-text`.

## Typography

- **Headings → Gambetta**, weight 600, tight tracking. Sizes scale with
  `clamp()` (see tokens). The homepage hero name is the largest step.
- **Body → DM Sans**, 1rem / 1.65 for UI and supporting copy.
- **Blog post body → `prose` step: 19px / 1.75** on the reading column. This is
  the deliberate "writing is the largest, most comfortable text" rule — the post
  body must read larger than the scaffolding around it (lists, cards, meta at
  16–17px).
- **Mono → JetBrains Mono** for code and small meta labels (date, reading time).
- Emphasis inside a heading uses italic/bold of the SAME family — never mix a
  second family for emphasis.

## Layout

Two container tracks, applied by responsibility:

- `.container` — wide track, `--container-wide` ~1100px. The default. Header,
  footer, the homepage Selected-work grid, the blog index and tag pages
  (`/blog`, `/tags`, `/tags/<tag>`), the blog post article, and any full-width
  block.
- `.container-prose` — reading track, `--container-prose` ~680px. The tightest,
  most comfortable measure: homepage intro/writing text and `/about` bio.

The site is deliberately wide: the blog post article runs on the full ~1100px
track, so the post body measure is long (~110 characters) rather than the
classic 60-80. This is an owner decision, not an oversight. Do not "fix" it back
to a narrow column. Do not globally narrow the header/footer.

Standalone supporting paragraphs on a wide-track page (a page intro, a card
description) still get `max-w-prose` so short copy does not stretch across the
whole track. Post images are capped at 820px and centred inside the text column
(`.prose-custom p > img`) so a screenshot reads as a figure, not a full-bleed
banner.

Sections use vertical rhythm `py-14 md:py-20`. Separate two adjacent
default-background sections with `<hr class="divider" />` (an ornamental
hairline with a short terracotta mark) inside a `.container`, or give one of the
two a `bg-background-subtle`. The homepage keeps a single subtle-background
section (Writing); the rest are default with a divider where they touch.

## Shapes & Elevation

- **One radius system:** cards `xl` (16px), buttons/tags/chips `pill`
  (9999px), inputs/small surfaces `md` (8px). Keep it consistent.
- **Shadows are tinted to the accent, never pure black.** Cards lift on hover
  (`translateY(-4px)` + a soft terracotta-tinted shadow). Dark theme uses a
  slightly stronger tint. No neon/outer glows.

## Components

Reusable classes live in `global.css` (`@layer utilities`). Prefer them over
new one-off styles.

- `.card` / `.card-lift` — surface panel with border; `.card-lift` adds the
  hover lift + tinted shadow.
- `.btn-primary` — pill, accent fill, AA-correct text per theme (see Colors).
- `.btn-secondary` — pill, transparent, border; accent border on hover.
- `.tag` — mono pill, secondary text on `bg-subtle`; accent-text on hover.
- `.topic` — mono pill in accent-text on a `color-mix` accent tint; the
  writing "topic mark" derived from a post's first tag.
- `.divider` — ornamental section rule with a short terracotta mark.
- `.link-underline` — text link with an accent underline that draws on hover.
- `.nav-link` — header nav item with an animated underline indicator.
- `.prose-custom` — blog article prose (Gambetta headings, 19px/1.75 body,
  accent-text links, tinted code blocks).

## Interaction

Motion is restrained and always motivated (`MOTION_INTENSITY ~4`).

- **Pixel spotlight** — site-wide (`PixelSpotlight.astro`, rendered once from
  `Layout.astro`). Two fixed full-viewport layers at `z-index: -1`: a static dot
  lattice on a 12px grid that is always visible, and a terracotta radial glow
  that follows the cursor, quantized into squares by two striped masks combined
  with `mask-composite: intersect`. Vanilla JS (`pointermove`, rAF-throttled,
  re-resolves its node on `astro:after-swap`, ignores `pointerType === 'touch'`).
  Under `prefers-reduced-motion` the glow is dropped and the static lattice
  stays.

  The glow tint (18%) and the cell fill (45% of the cell) are held down
  deliberately: the layer sits under body text, and at the 22% / 72% it started
  from, an `accent-text` link over a lit cell measures 3.9:1 against 5.1:1 on
  the bare background. Raising either number reopens that contrast hole.

  Because the layer sits behind everything, an opaque background hides it. Use
  that deliberately, in one direction or the other:

  - Sections that should let the field through use `bg-background-subtle/85`
    rather than the flat token (the Writing section, the About page's Expertise
    band). New subtle sections should follow suit.
  - The footer keeps `bg-background` so the field stops there and the page
    closes on a plain band.
  - Cards stay opaque: they are meant to read as surfaces sitting on top of the
    field.

- **Hover underlines** — links/nav draw an accent underline on hover.
- **Card lift** — subtle translate + tinted shadow on hover.

Any new motion above a hover state MUST honor `prefers-reduced-motion` and must
justify itself (feedback / hierarchy / state / storytelling). No ambient loops
on informational sections. Interactions are Astro islands / small vanilla
scripts — no React/Motion in this project.

## Do's and Don'ts

**Do**

- Default to `.container` (~1100px), including for the blog post article; use
  `.container-prose` (~680px) only for the homepage intro and `/about` bio.
- Render a post in a list with `PostCard.astro` (`featured` for the lead card)
  rather than hand-rolling another row layout.
- Use `--color-accent` for fills and `--color-accent-text` for small accent
  text/links (AA).
- Keep the blog post body at the `prose` step (19px / 1.75); supporting text at
  16–17px.
- Reuse the component classes above; extend `global.css` rather than inlining
  bespoke styles.
- Separate adjacent default-bg sections with `<hr class="divider" />`.
- Honor `prefers-reduced-motion` for any motion.
- Keep the theme swap on `[data-theme='cloud' | 'cloud-dark']` CSS variables.

**Don't**

- **No em-dash (`—`) or en-dash (`–`) in visible page copy** — headlines,
  labels, meta, ranges, button text, alt text. Use a hyphen, comma, or period.
  (Prose docs like this file are exempt; the ban is for rendered site copy.)
- No numbered or uppercase-mono "eyebrow" labels above headings
  (`01 — About`, `// section`). The headline alone names the section.
- No second accent color, and no leftover purple (`#7c5cff` /
  `rgba(124,92,255)`).
- No portrait or monogram in the intro — the identity is typographic.
- No section that inverts the theme mid-page.
- No third theme (the terminal theme was removed).
- Don't use the bright `--color-accent` as small text on a light background
  (fails AA — use `--color-accent-text`).

## How to add a new page or section

1. Wrap it in `<section class="py-14 md:py-20">`; text goes in
   `.container-prose`, wide grids in `.container`.
2. Lead with a Gambetta heading (default `h2`). No eyebrow.
3. Build from the existing components (`.card`, `.btn-primary`, `.tag`,
   `.topic`, `.divider`, `.link-underline`).
4. Accent usage: fills → `var(--color-accent)`; small text/links →
   `var(--color-accent-text)`.
5. Separate it from its neighbor with a `.divider`, or give one section a
   `bg-background-subtle` (keep at most one subtle section per view).
6. For any interaction, add a `prefers-reduced-motion` guard and keep it to one
   motivated effect.
7. Verify: `npm run build` and `npm run lint` are green; the acceptance sweep
   `grep -rniE "terminal|grid-pattern|general sans|section-label|7c5cff|—|–" src/`
   returns nothing new; check the surface in both light and dark.
