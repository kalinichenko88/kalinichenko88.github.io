# Motion Profiles Design

**Date:** 2026-08-03

**Status:** Approved for implementation planning

## Summary

Add a site-wide motion system with three selectable profiles: Calm, Expressive, and Experimental. A floating control lets each visitor switch profiles and stores the choice locally. Calm is the default for new visitors. The system uses native CSS, `IntersectionObserver`, and small vanilla JavaScript controllers, with no new animation dependency.

The visual direction remains the site's existing content-first editorial design. Motion supports hierarchy, storytelling, feedback, and state changes without changing the information architecture, copy, theme system, or terracotta accent.

## Goals

- Reveal major page blocks as they enter the viewport.
- Give visitors three meaningfully different motion profiles.
- Make the active profile easy to change from any page.
- Preserve Astro View Transitions, theme switching, keyboard navigation, reading comfort, and current performance characteristics.
- Honor `prefers-reduced-motion` in every profile.
- Keep all content visible when JavaScript or optional browser features are unavailable.

## Non-goals

- No horizontal scroll hijacking, pinned storytelling scenes, sticky card stacks, or infinite ambient loops.
- No GSAP, Motion, React, or other animation dependency.
- No redesign of existing layouts, copy, colors, routes, or navigation.
- No per-paragraph reveal animation inside articles.
- No change to the Pixel Spotlight tint or density, which are contrast constrained.

## Design Direction

Read this as a developer portfolio and editorial site for recruiters, peers, and collaborators. Preserve the warm Terracotta and Slate palette, typographic identity, restrained materiality, and current visual density.

Design dials for this feature:

- `DESIGN_VARIANCE: 6` - preserve the current layout and add motion without recomposing sections.
- `MOTION_INTENSITY: 4 / 6 / 8` - Calm, Expressive, and Experimental respectively.
- `VISUAL_DENSITY: 4` - unchanged.

The design system remains native Astro and Tailwind CSS with CSS custom properties. Animation behavior is implemented with CSS and vanilla JavaScript.

## Motion Switcher

Create a global `MotionSwitcher.astro` rendered by `Layout.astro` immediately after `Footer`. Its fixed positioning keeps it independent of document flow.

### Collapsed state

- Fixed in the bottom-right corner.
- Compact pill button labelled `Motion: Calm`, `Motion: Expressive`, or `Motion: Experimental`.
- Uses existing surface, border, radius, type, and accent tokens.
- Sits above the mobile safe area and does not obscure primary page actions.
- Has a documented z-index below modal-level UI and above page content.

### Expanded state

- Opens upward from the trigger as a compact surface panel.
- Contains one radio group with `Calm`, `Expressive`, and `Experimental` options.
- Each option includes one short functional description.
- The selected option uses the existing terracotta accent and check icon.
- No new decorative color, glow, or animated loop.

### Interaction

- Opens and closes on trigger activation.
- Closes after a profile is selected, on outside click, and on Escape.
- Returns focus to the trigger after Escape.
- Exposes correct `aria-expanded`, `aria-controls`, radio state, and visible focus styles.
- Works by keyboard and touch.

## Profile State and Initialization

The active value is one of:

```text
calm | expressive | experimental
```

Store the value under the `motion-profile` `localStorage` key and mirror it on the root element:

```html
<html data-motion="calm">
```

An inline script in `Layout.astro`, placed alongside the existing theme initialization, reads and validates the stored value before the page paints. Missing or invalid values resolve to `calm`. Storage access is wrapped so blocked storage also resolves to `calm`.

The selected value survives navigation and later visits. Astro's `before-swap` hook copies the active motion profile to the incoming document, preventing a flash of the default profile during View Transitions.

Changing the profile updates `data-motion`, persists the value, updates the switcher UI, and dispatches a `motion-changed` event. The motion controller replays reveal effects only for currently visible annotated elements so the visitor can compare profiles immediately. It does not replay every item on the page.

## Declarative Motion API

Existing page components opt in through data attributes instead of embedding animation code:

- `data-reveal="hero"` identifies a hero item.
- `data-reveal="heading"` identifies a section or page heading.
- `data-reveal="content"` identifies a structural content block.
- `data-reveal="card"` identifies a card or list row.
- `data-stagger-group` groups sibling reveals.
- `data-stagger-index` provides deterministic ordering.
- `data-reactive` enables pointer response on eligible cards.
- `data-scroll-depth` enables optional Experimental scroll-linked depth.

The attributes do not hide content by themselves. CSS hides or offsets elements only after the motion controller sets `data-motion-ready` on the document root. This guarantees visible content when JavaScript fails.

## Shared Motion Controller

A small vanilla JavaScript controller initializes on first load and after Astro navigation.

Responsibilities:

- Disconnect the previous `IntersectionObserver` before observing the new page.
- Mark annotated elements as revealed when they cross the viewport threshold.
- Apply deterministic stagger indexes without timers per element.
- Manage pointer-reactive CSS custom properties through one requestAnimationFrame-throttled pointer handler.
- Replay only visible annotated elements after `motion-changed`.
- Remove stale pointer transforms when the pointer leaves an element or the profile changes.

The controller must not use `window.addEventListener('scroll', ...)`, React state, or layout-mutating animation. Scroll-linked effects use native CSS timelines behind feature detection.

## Motion Profiles

### Calm

Calm is the default and should feel like a polished extension of the current site.

- Hero items reveal in order: name, lead, supporting copy, actions.
- Major section headings and content fade in while moving upward by 14 pixels.
- Project cards and post rows use a short stagger.
- Existing card lift, link underline, and button press feedback remain.
- Pointer tilt, scroll depth, and kinetic typography are disabled.
- Reveals run once during normal scrolling.

### Expressive

Expressive increases hierarchy and spatial feedback without changing layout.

- Hero text uses a larger offset and longer sequence.
- Section heading and section body reveal as separate beats.
- Eligible project cards receive a small pointer-driven rotation and translation.
- The terracotta divider mark expands as its divider enters view.
- Key annotated blocks receive subtle scroll-linked vertical depth where supported.
- Motion stays bounded and settles quickly; no element loops indefinitely.

### Experimental

Experimental is the most kinetic profile while preserving reading comfort.

- The hero name reveals by words or accessible visual fragments.
- Headings, cards, and metadata use different scroll-depth rates to create layered movement.
- Featured project cards enter with a small opposing rotation and settle to zero.
- Eligible cards use a stronger but capped pointer response.
- Accent marks and section transitions use longer, more noticeable choreography.
- Article pages limit this profile to the page header, table of contents, media, and large structural blocks. Article paragraphs remain static.

The profile explicitly excludes scroll hijacking, pinned scenes, sticky stacks, and infinite motion because those patterns would conflict with the site's editorial reading model and dynamic mode switching.

## CSS Architecture

Keep the motion tokens and selectors in a clearly labelled section of `src/styles/global.css`, consistent with the repository's design-system guidance.

Define semantic CSS custom properties on each profile, including:

- reveal distance;
- reveal duration;
- stagger interval;
- easing curve;
- pointer rotation cap;
- pointer translation cap;
- scroll-depth distance.

All animations use only `transform` and `opacity`. Profile selectors consume the same semantic tokens instead of duplicating component-specific values. Experimental scroll-linked rules live inside `@supports (animation-timeline: view())` or the matching supported syntax. Browsers without support retain the observer-driven reveal behavior and pointer feedback.

## Reduced Motion and Progressive Enhancement

`prefers-reduced-motion: reduce` overrides every selected profile:

- annotated content renders immediately at full opacity and zero transform;
- stagger delays become zero;
- pointer response is disabled;
- scroll-linked animations are disabled;
- switcher panel feedback becomes instant or near-instant.

The stored profile is not overwritten, so the visitor's choice remains available if their operating-system preference changes later.

Additional fallbacks:

- Without JavaScript, all content remains visible and the switcher is inert but readable.
- Without `IntersectionObserver`, the controller marks all reveal elements visible.
- Without scroll-driven animation support, Expressive and Experimental retain their entry and pointer behavior.
- Invalid stored values resolve to Calm.
- Controller reinitialization is idempotent and never accumulates observers or pointer handlers.

## Page Coverage

### Home page

- Hero text and actions.
- Section headings and header links.
- Featured project cards and additional project rows.
- Lead post and recent post rows.
- Contact heading, copy, and actions.
- Section divider mark.

### Index and tag pages

- Page heading and introduction.
- Post cards or tag groups as staggered collections.

### Article pages

- Back link, title, description, metadata, table of contents, and major media blocks.
- No reveal on each prose paragraph or list item.

### About and utility pages

- Page header and major section-level blocks.
- Error-page primary content receives only Calm-style entry even when a stronger profile is selected, to keep the recovery path immediate.

## Accessibility

- Honor reduced motion without requiring a separate setting.
- Keep DOM reading order and focus order unchanged.
- Never split accessible text into fragments without preserving one accessible label and hiding decorative fragments from assistive technology.
- Keep switcher labels concise and functional.
- Maintain existing button, text, border, and focus contrast in both themes.
- Do not place motion-triggering hover behavior on touch-only devices.
- Do not make content availability depend on animation completion.

## Performance

- Add no third-party runtime dependency.
- Use one observer per page, not one observer per element.
- Use one throttled pointer pipeline and CSS custom properties for reactive cards.
- Animate only transform and opacity.
- Avoid forced layout reads inside animation frames.
- Keep `will-change` limited to actively reactive or currently animating elements.
- Preserve the current scroll progress indicator and Pixel Spotlight implementation.

## Verification

Automated checks:

- `npm run build`
- `npm run check`
- `npm run lint`
- `npm run format:check`
- Existing acceptance scan from `DESIGN.md`

Manual verification matrix:

- Calm, Expressive, and Experimental on the home page.
- Light and dark themes for each profile.
- Desktop pointer, keyboard-only navigation, touch viewport, and mobile safe-area placement.
- Reduced-motion emulation with every profile selected.
- Direct load, internal Astro navigation, browser back/forward navigation, and mode persistence after reload.
- Unsupported scroll-timeline fallback.
- No hidden content when JavaScript is disabled.
- No duplicate observers or pointer handlers after repeated page transitions.
- No overlap between the floating switcher and primary actions at supported viewport sizes.

## Acceptance Criteria

- A new visitor receives Calm without a visible initialization flash.
- The floating switcher is available on every page and exposes all three profiles.
- A visitor's selection persists locally across navigation and reloads.
- The three profiles are visibly distinct on the home page.
- Reduced-motion visitors see static content regardless of stored profile.
- Article body reading remains stable and free of per-paragraph reveals.
- Unsupported browser features degrade to visible, usable content.
- No new runtime dependency is added.
- Production build, type checks, lint, formatting, and the design-system acceptance scan pass.
