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

### TableOfContents (`src/components/TableOfContents.astro`)

Auto-generated from markdown headings (h2/h3) via Astro's `render()` `headings` array. Rendered once as an inline TOC above the article content in blog post pages (`src/pages/blog/[...id].astro`); it scrolls away naturally on the reading track. Active section tracking (an `IntersectionObserver` re-initialized on `astro:after-swap`) highlights the current heading's TOC link as the user scrolls. Headings use `scroll-margin-top` for proper anchor offset.

## Section Background Alternation

Homepage sections no longer strictly alternate. Only the Writing section carries the subtle background (`bg-background-subtle`); the others use the default background. When adding or reordering sections, don't assume alternation — check each section's intent instead. Header and Footer both use `bg-background` (matching each other, distinct from sections).

Current order: Hero(default) → Selected work/Projects(default) → Writing(subtle) → Contact(default) → Footer(bg-background).

## Containers & Fonts

- Three container tracks in `global.css`: `.container` (wide, `--container-wide: 1100px`, used for header/footer and most sections), `.container-content` (content track, `--container-content: 820px`, used for the blog reading experience — post articles, the blog index, and tag pages), and `.container-prose` (tight reading column, `--container-prose: 680px`, used for the homepage intro text and `/about` bio).
- Font stack (configured via Astro's top-level `fonts` config in `astro.config.js`): Gambetta (display/headings), DM Sans (body), JetBrains Mono (code/mono accents).

## Key Patterns

- Use `type` instead of `interface` for Astro component `Props`
- Uses Astro's experimental features: `clientPrerender`, `contentIntellisense`, `svgOptimizer`
- Fonts configured via top-level `fonts` config (stabilized in Astro 6)
- Tailwind 4 via Vite plugin (`@tailwindcss/vite`). There is no `tailwind.config.js` and no PostCSS config on purpose: Tailwind 4 ignores a legacy config file unless `global.css` opts in with `@config`, and its bundled Lightning CSS already handles vendor prefixing and minification. Configure the theme in the `@theme` block in `global.css`
- Typography plugin for prose styling (`@tailwindcss/typography`)
- Theme switching lives entirely in `Header.astro` (dropdown, `Cmd/Ctrl + /` cycling, OS-preference sync) plus the inline anti-flash script in `Layout.astro`. `src/config/themes.ts` is the single source of theme ids (`LIGHT_THEME` / `DARK_THEME`); since `is:inline` scripts cannot import, `Layout.astro` passes them to the anti-flash script through `data-light` / `data-dark` attributes rather than hardcoding them
- The scroll progress bar is pure CSS (`animation-timeline: scroll()` in `global.css`), decorative and `aria-hidden`. Browsers without scroll-driven animations simply do not show it
- ESLint with TypeScript, Astro, and jsx-a11y plugins
- External links in markdown open in new tabs (`rehype-external-links` in `astro.config.js`)
- Site constants in `src/consts.ts`
