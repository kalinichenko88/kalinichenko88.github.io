---
name: design-check
description: Use when adding or changing any page, section, or UI component in this repo (kalinichenko.dev), or when asked to verify design-system / DESIGN.md compliance, contrast, or visual consistency.
---

# design-check

## Overview

Keeps new UI consistent with the site's design system. The mechanical, provable
rules (WCAG contrast, forbidden leftovers, theme-id integrity, em-dash in copy)
are enforced by a script; the judgment calls are a checklist you apply yourself.
The rules and tokens live in [`DESIGN.md`](../../../DESIGN.md) at the repo root —
read it if a check is unclear.

## When to use

- Before finishing a new page, section, or component.
- After changing the palette, fonts, containers, or a shared component class.
- When asked to "check the design", "verify contrast", or "is this on-brand".

## Run it

```bash
# mechanical audit (contrast + forbidden patterns + theme ids + em-dash advisory)
node .claude/skills/design-check/check-design.mjs

# prove the contrast math is trustworthy
node .claude/skills/design-check/check-design.mjs --selftest

# the project gate, everything CI runs
npm run verify
```

Exit code 1 = a hard rule failed (fix before shipping). `npm test` runs the same
hard rules through `tests/design-check.test.ts`, so they fail CI too. Advisory items (em-dash
in `.astro`/`.ts` files) are printed for you to review, not auto-failed — some
may be in code, not visible copy.

## What the script checks

WCAG AA (>=4.5:1) in both themes for the small-text tokens (`text-tertiary`,
`accent-text`) and the `.topic` pill (read from its rule, tint included) on every
fill they sit on: page `bg`, `bg-subtle`, card `surface` and `accent-subtle`
(`.tag` on hover); plus CTA text on
the button fill. No leftover purple / `.section-label` / terminal theme /
`grid-pattern` / General Sans; theme ids stay `cloud` / `cloud-dark`; flags
`—`/`–` in `src/**/*.{astro,ts}`.

Opaque `bg-subtle` stands in for the `bg-background-subtle/85` bands, since it
is the worst case of their fill. The PixelSpotlight dots and glow that show
through are not modelled; the Interaction section of `DESIGN.md` budgets them.
A new fill, or small text in a new token, needs adding to the loop in the
script.

## Judgment checklist (the script can't verify these)

- **Accent split:** bright `--color-accent` only for FILLS; `--color-accent-text`
  for small accent text/links. Any new small accent text uses `-text`.
- **Container track:** `.container` (~1100px) by default, including the blog
  post article; `.container-prose` (~680px) only for `/about` reading text (bio,
  work history); the homepage intro uses `--container-prose` as a max-width.
  Post body at the 19px/1.75 `prose` step.
- **No eyebrow:** the headline names the section; no numbered/uppercase-mono
  label above it.
- **Motion:** `data-reveal` on major structural blocks only, never on article
  prose (`npm test` enforces both). Any other interaction is one motivated
  effect with a `prefers-reduced-motion` guard.
- **Section backgrounds:** sections do not alternate. A new subtle section uses
  the translucent `bg-background-subtle/85`, so the pixel field shows through;
  keep at most one per view. `.divider` exists but the homepage uses none.
- **Visual smoke in BOTH themes:** `npm run dev` (port 3000), then look at the
  surface in light and dark; `Cmd/Ctrl + /` cycles the theme.

## If a check fails

Fix against `DESIGN.md`, then re-run. Do not weaken a token to pass contrast
without checking every pair the change touches.
