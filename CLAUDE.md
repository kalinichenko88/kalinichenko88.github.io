# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Design system:** before building or changing any page, section, or UI component, read [`DESIGN.md`](./DESIGN.md) at the repo root. It holds the authoritative tokens (palette with the `accent` vs `accent-text` AA rule, typography scale, container tracks), the component classes, interaction patterns, the Do's/Don'ts (em-dash ban in copy, one accent, reading vs wide track, no eyebrows), and a "how to add a new page/section" playbook.

## Build & Development Commands

```bash
npm run dev       # Start dev server on port 3000
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run lint:fix  # Auto-fix ESLint issues
npm run format    # Format with Prettier
```

A Husky pre-commit hook runs lint-staged (`eslint --fix` + `prettier --write`) on staged files, so committing may reformat them.

## Environment Setup

No environment variables are required. The build makes no network calls beyond font fetching.

## Architecture

This is an Astro 7 personal portfolio site with:

- **Content Collections** (`src/content.config.ts`): Two collections - `posts` (markdown blog) and `projects` (YAML). Project cards are fully described by their YAML: `slug` doubles as the GitHub repo name (the repo URL is derived from it), with optional `homepage` and hand-maintained `stars`. There is no GitHub API call at build time.
- **Theme System** (`src/config/themes.ts`, `src/styles/global.css`): Two themes (cloud light, cloud-dark), selectable as Light, Dark, or Auto (follows system preference), controlled via `data-theme` attribute on `<html>`. Theme CSS uses CSS custom properties with Tailwind 4's `@theme` directive for integration
- **Layout** (`src/components/Layout.astro`): Single layout with theme initialization script (inline to prevent flash), Header, Footer, and slot for content
- **Global Styles** (`src/styles/global.css`): Design tokens, theme definitions, Tailwind extensions, and utility classes (`.card`, `.btn-primary`, `.prose-custom`, etc.)

## Content Structure

- `content/posts/*.md` - Blog posts with frontmatter: `title`, `description`, `pubDate`, `tags[]`
- `content/projects/*.yml` - Projects with: `name`, `slug` (GitHub repo name), `order`, `tagline` (required), `featured`, `tech[]`, optional `homepage`, optional `stars`

### Tags

Every tag becomes a page under `/tags/<tag>`, so a tag only earns its place if it groups posts. Keep the vocabulary small and reuse existing tags before inventing one — check `content/posts/*` first.

- 2 to 3 tags per post. One tool tag (`obsidian`, `neovim`, `claude-code`) plus one or two topic tags (`ai`, `git`, `personal-finance`, `meta`).
- The first tag is the chip shown on `/blog` (`src/pages/blog/index.astro`), so put the most specific one first.
- No attribute tags (`plugin`, `markdown`) and no near-synonyms (`tooling` next to `automation`). Both were removed for this reason.

### Post images

Put them in `src/assets/images/` and reference them with a relative path from the markdown file (`../../src/assets/images/foo.png`). Astro's image pipeline then optimizes them and emits `width`/`height`. Images under `public/` are served as-is and skip all of that.

## Components

### VideoPlayer (`src/components/VideoPlayer.astro`)

Embed video with play/pause overlay and caption. Place video files in `public/videos/`.

Not currently used by any post. It is kept deliberately for upcoming content, so
don't remove it as dead code.

Usage in MDX posts:

```mdx
import VideoPlayer from '../../src/components/VideoPlayer.astro';

<VideoPlayer src="/videos/my-demo.mp4" caption="Description shown below the video" />

<!-- With poster image -->

<VideoPlayer
  src="/videos/my-demo.mp4"
  caption="Description shown below the video"
  poster="/images/my-poster.jpg"
/>
```

Props: `src` (required), `caption` (required), `poster` (optional). Video is looped, muted, and plays inline. Click to play/pause. Uses a custom element for proper View Transitions lifecycle.

### PixelSpotlight (`src/components/PixelSpotlight.astro`)

The site-wide cursor effect: a static 12px dot lattice plus a pixel-quantized terracotta glow that follows the pointer, both as fixed full-viewport layers at `z-index: -1`. Rendered once from `Layout.astro`, so every page carries it - don't add it per page. Its tint and cell fill are contrast-constrained — read the Interaction section of [`DESIGN.md`](./DESIGN.md) before turning either up.

### TableOfContents (`src/components/TableOfContents.astro`)

Auto-generated from markdown headings (h2/h3) via Astro's `render()` `headings` array. Rendered once as an inline TOC above the article content in blog post pages (`src/pages/blog/[...id].astro`); it scrolls away naturally on the reading track. Active section tracking (an `IntersectionObserver` re-initialized on `astro:after-swap`) highlights the current heading's TOC link as the user scrolls. Headings use `scroll-margin-top` for proper anchor offset.

## Section Background Alternation

Homepage sections no longer strictly alternate. Only the Writing section carries the subtle background, and it is translucent (`bg-background-subtle/85`) so the pixel field shows through; the others use the default background. The same applies to the About page's Expertise band. Any new subtle section should use `/85` too, or it will punch a rectangular hole in the field. When adding or reordering sections, don't assume alternation — check each section's intent instead. The Footer keeps an opaque `bg-background` on purpose: it stops the pixel field so the page closes on a plain band. The Header is `bg-background/80` with a blur, so the field shows through it blurred.

Current order: Hero(default) → Selected work/Projects(default) → Writing(subtle, translucent) → Contact(default) → Footer(bg-background).

## Containers & Fonts

- Two container tracks in `global.css`: `.container` (wide, `--container-wide: 1100px`) is the default and covers header/footer, all sections, the post index pages (`/blog`, `/tags`, `/tags/<tag>`) and the blog post article; `.container-prose` (tight reading column, `--container-prose: 680px`) is only for the homepage intro text and the `/about` bio. The wide post body is a deliberate owner choice — don't narrow it back. (`.container-content`, the old 820px track, was removed once nothing used it.)
- Post images are capped at 820px and centred inside the wide text column (`.prose-custom p > img` in `global.css`) so a screenshot stays a figure rather than a full-bleed banner.
- Posts in a list render through `src/components/PostCard.astro` (pass `featured` for the lead card). Both `/blog` and `/tags/<tag>` use it — don't hand-roll a second row layout.
- Font stack (configured via Astro's top-level `fonts` config in `astro.config.js`): DM Sans (headings and body, via both `--font-display` and `--font-body`), JetBrains Mono (code/mono accents). Only two families load; headings separate from body by size, weight and tracking, not by a second face.

## Key Patterns

- Use `type` instead of `interface` for Astro component `Props`
- Uses Astro's experimental features: `clientPrerender`, `contentIntellisense`, `svgOptimizer`
- Fonts configured via top-level `fonts` config (stabilized in Astro 6)
- Tailwind 4 via Vite plugin (`@tailwindcss/vite`). There is no `tailwind.config.js` and no PostCSS config on purpose: Tailwind 4 ignores a legacy config file unless `global.css` opts in with `@config`, and its bundled Lightning CSS already handles vendor prefixing and minification. Configure the theme in the `@theme` block in `global.css`
- Typography plugin for prose styling (`@tailwindcss/typography`)
- Theme switching lives entirely in `Header.astro` (dropdown, `Cmd/Ctrl + /` cycling, OS-preference sync) plus the inline anti-flash script in `Layout.astro`. `src/config/themes.ts` is the single source of theme ids (`LIGHT_THEME` / `DARK_THEME`); since `is:inline` scripts cannot import, `Layout.astro` passes them to the anti-flash script through `data-light` / `data-dark` attributes rather than hardcoding them
- The scroll progress bar is pure CSS (`animation-timeline: scroll()` in `global.css`), decorative and `aria-hidden`. Browsers without scroll-driven animations simply do not show it
- ESLint with TypeScript and Astro plugins (`eslint.config.js`)
- External links in markdown open in new tabs (`rehype-external-links` in `astro.config.js`)
- Site constants in `src/consts.ts`
