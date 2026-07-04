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

# the project gates (no unit-test suite exists)
npm run build && npm run lint
```

Exit code 1 = a hard rule failed (fix before shipping). Advisory items (em-dash
in `.astro` copy) are printed for you to review, not auto-failed — some may be
in code, not visible copy.

## What the script checks

WCAG AA (>=4.5:1) on the four critical pairs, both themes; no leftover purple /
`.section-label` / terminal theme / `grid-pattern` / General Sans; theme ids stay
`cloud` / `cloud-dark`; flags `—`/`–` in `.astro` files.

## Judgment checklist (the script can't verify these)

- **Accent split:** bright `--color-accent` only for FILLS; `--color-accent-text`
  for small accent text/links. Any new small accent text uses `-text`.
- **Container track:** reading content on `.container-prose` (~680px); wide
  blocks on `.container` (~1100px). Post body at the 19px/1.75 `prose` step.
- **No eyebrow:** the headline names the section; no numbered/uppercase-mono
  label above it.
- **One motivated interaction max**, with a `prefers-reduced-motion` guard.
- **Section separation:** a `<hr class="divider" />` or one `bg-background-subtle`
  section between adjacent default-bg sections (not more than one subtle per view).
- **Visual smoke in BOTH themes** (light + dark) before calling it done.

## If a check fails

Fix against `DESIGN.md`, then re-run. Do not weaken a token to pass contrast
without checking every pair the change touches.
