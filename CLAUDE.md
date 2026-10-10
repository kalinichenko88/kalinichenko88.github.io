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
npm run format:check  # Check formatting without writing
npm run check     # astro check (types + .astro diagnostics)
npm test          # node:test suite in tests/, including the design-check hard rules
npm run verify    # everything CI runs: lint, check, format:check, test, build
```

A Husky pre-commit hook runs lint-staged (`eslint --fix` + `prettier --write`) on staged files, so committing may reformat them.

## Environment Setup

No environment variables are required. Besides font fetching, the build makes one GitHub API call per project for its star count (see below). `astro dev` skips it and shows the YAML counts, since dev renders `/` on every request. The call is unauthenticated unless `GITHUB_TOKEN` is set; CI sets the workflow's built-in one for the higher rate limit, and no personal token is ever needed. A stale `GITHUB_TOKEN` in your shell makes GitHub answer 401, so the counts fall back to YAML with a warning.

## Architecture

This is an Astro 7 personal portfolio site with:

- **Content Collections** (`src/content.config.ts`): Two collections - `posts` (markdown blog) and `projects` (YAML). Project cards are fully described by their YAML: `slug` doubles as the GitHub repo name (the repo URL is derived from it), with optional `homepage` and a fallback `stars`. The homepage reads each repo's live star count at build time (`src/lib/github-stars.ts`, plain `fetch`, no dependency) and falls back to the YAML `stars` on any failure, so a GitHub rate limit or outage never fails the build. The deploy workflow also runs weekly on a `schedule:` so counts refresh between pushes.
- **Theme System** (`src/config/themes.ts`, `src/styles/global.css`): Two themes (cloud light, cloud-dark), selectable as Light, Dark, or Auto (follows system preference), controlled via `data-theme` attribute on `<html>`. Theme CSS uses CSS custom properties with Tailwind 4's `@theme` directive for integration
- **Layout** (`src/components/Layout.astro`): Single layout with theme initialization script (inline to prevent flash), Header, Footer, and slot for content
- **Global Styles** (`src/styles/global.css`): Design tokens, theme definitions, Tailwind extensions, and utility classes (`.card`, `.btn-primary`, `.prose-custom`, etc.)

## Content Structure

- `content/posts/*.{md,mdx}` - Blog posts with frontmatter: `title`, `description`, `pubDate`, `tags[]`, `cover` (see Post covers)
- `content/projects/*.yml` - Projects with: `name`, `slug` (GitHub repo name), `order`, `tagline` (required), `featured`, `tech[]`, optional `homepage`, optional `stars` (fallback only; the live GitHub count wins)

### Tags

Every tag becomes a page under `/tags/<tag>`, so a tag only earns its place if it groups posts. Keep the vocabulary small and reuse existing tags before inventing one — check `content/posts/*` first.

- 2 to 3 tags per post. One tool tag (`obsidian`, `neovim`, `claude-code`) plus one or two topic tags (`ai`, `git`, `personal-finance`, `meta`, `code-review`). A post about the site itself has no tool to name and carries `meta` alone.
- `tests/post-tags.test.ts` enforces this and holds the vocabulary. A new tag goes there too.
- The first tag is the chip shown on `/blog` (`src/pages/blog/index.astro`), so put the most specific one first.
- No attribute tags (`plugin`, `markdown`) and no near-synonyms (`tooling` next to `automation`). Both were removed for this reason.

### Post images

Put them in `src/assets/images/` and reference them with a relative path from the markdown file (`../../src/assets/images/foo.png`). Astro's image pipeline then optimizes them and emits `width`/`height`. Images under `public/` are served as-is and skip all of that.

### Post covers

Every post has a cover illustration: `cover: ../../src/assets/images/covers/<post-id>.png` in its frontmatter. Make one with the `illustrate-post` project skill (`.claude/skills/illustrate-post/`), which generates three variants through Codex and lets the author pick; never hand-edit a cover file. The schema keeps `cover` optional so a draft renders, and `tests/post-covers.test.ts` requires exactly one cover per post and checks every cover went through the skill's `prepare.mjs` (palette-compressed, transparent, trimmed to its drawing, named after the post, with its social image next to it). How covers are shown is in the Illustrations section of [`DESIGN.md`](./DESIGN.md). Each cover has a 1200×630 `<post-id>.og.jpg` beside it, written by the skill; the post page picks it up by name for `og:image`, `twitter:image` and JSON-LD `image`, passing it through `Layout` to `Head` as `image`; pages without one keep the author photo.

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

The glow lights bare background only: it drops when the cursor is on text, on that text's margin box, or between two text blocks — but not when that text sits on an opaque fill, where the glow is covered and cannot tint anything. The `TEXT` selector, the stepped probe, the margin check and the opaque-fill check are all load-bearing; narrowing any of them puts the tint back behind the words, and dropping the opaque-fill check kills the glow across whole cards. It also recomputes on a passive, rAF-throttled `scroll` listener, since what sits under a still cursor changes as the page moves. Post covers are transparent images, not text: the glow lights their empty parts like any bare background, on purpose. See the Interaction section of `DESIGN.md` for why each rule exists.

### Motion (`src/components/MotionController.astro` → `src/lib/motion-controller.ts`)

Rendered once from `Layout.astro`. Pages opt major blocks into reveal with `data-reveal`; article prose must not carry it. `tests/motion-*.test.ts` enforce both, plus the CSS guards. The rules and why each exists are in the Interaction section of [`DESIGN.md`](./DESIGN.md).

### TableOfContents (`src/components/TableOfContents.astro`)

Auto-generated from markdown headings (h2/h3) via Astro's `render()` `headings` array. Rendered once as an inline TOC above the article content in blog post pages (`src/pages/blog/[...id].astro`); it scrolls away with the article. Active section tracking highlights the current heading's TOC link as the user scrolls; its `IntersectionObserver` (re-initialized on `astro:after-swap`) lives in that page, not in the component. Headings use `scroll-margin-top` for proper anchor offset.

## Section Backgrounds

Homepage sections no longer strictly alternate. Only the Writing section carries the subtle background, and it is translucent (`bg-background-subtle/85`) so the pixel field shows through; the others use the default background. The same applies to the About page's Expertise band. Any new subtle section should use `/85` too, or it will punch a rectangular hole in the field. When adding or reordering sections, don't assume alternation — check each section's intent instead. The Footer keeps an opaque `bg-background` on purpose: it stops the pixel field so the page closes on a plain band. The Header is `bg-background/80` with a blur, so the field shows through it blurred.

Current order: Hero(default) → Selected work/Projects(default) → Writing(subtle, translucent) → Contact(default) → Footer(bg-background).

## Containers & Fonts

- Two container tracks in `global.css`: `.container` (wide, `--container-wide: 1100px`) is the default and covers header/footer, all sections, the post index pages (`/blog`, `/tags`, `/tags/<tag>`) and the blog post article; `.container-prose` (tight reading column, `--container-prose: 680px`) wraps only the `/about` bio and work history; the homepage intro reuses the same measure through `--container-prose` on its `.intro` block. The wide post body is a deliberate owner choice — don't narrow it back. (`.container-content`, the old 820px track, was removed once nothing used it.)
- Post images are capped at 820px and centred inside the wide text column (`.prose-custom p > img` in `global.css`) so a screenshot stays a figure rather than a full-bleed banner.
- Posts in a list render through `src/components/PostCard.astro`: on `/blog` and `/tags/<tag>` packed into a CSS-columns masonry (`columns-1 md:columns-2 lg:columns-3`), on the homepage Writing section as one sideways scroll-snap row of the latest eight (`heading="h3"` and `row`: equal-height cards with one cover box height, and no per-card reveal, since the row reveals as one block). The row hides its scrollbar on every system; the `post-row` custom element in `BlogSection.astro` drives the ← → buttons. There is no featured lead card. The container owns the layout classes through `*:` children utilities — don't hand-roll a second card.
- Font stack (configured via Astro's top-level `fonts` config in `astro.config.js`): DM Sans (headings and body, via both `--font-display` and `--font-body`), JetBrains Mono (code/mono accents). Only two families load; headings separate from body by size, weight and tracking, not by a second face.

## Key Patterns

- Use `type` instead of `interface` for Astro component `Props`
- Uses Astro's experimental features: `clientPrerender`, `contentIntellisense`, `svgOptimizer`
- Tailwind 4 via Vite plugin (`@tailwindcss/vite`). There is no `tailwind.config.js` and no PostCSS config on purpose: Tailwind 4 ignores a legacy config file unless `global.css` opts in with `@config`, and its bundled Lightning CSS already handles vendor prefixing and minification. Configure the theme in the `@theme` block in `global.css`
- Typography plugin for prose styling (`@tailwindcss/typography`)
- Theme switching lives entirely in `Header.astro` (dropdown, `Cmd/Ctrl + /` cycling, OS-preference sync) plus the inline anti-flash script in `Layout.astro`. `src/config/themes.ts` is the single source of theme ids (`LIGHT_THEME` / `DARK_THEME`); since `is:inline` scripts cannot import, `Layout.astro` passes them to the anti-flash script through `data-light` / `data-dark` attributes rather than hardcoding them
- The scroll progress bar is pure CSS (`animation-timeline: scroll()` in `global.css`), decorative and `aria-hidden`. Browsers without scroll-driven animations simply do not show it
- ESLint with TypeScript and Astro plugins (`eslint.config.js`)
- External links in markdown open in new tabs (`rehype-external-links` in `astro.config.js`)
- Site constants in `src/consts.ts`

## Dependency Updates

- `overrides` forces `postcss-selector-parser` ^7.1.6 under `@tailwindcss/typography`, which pins 6.0.10 and fails `npm audit`. Drop it once typography ships on the v7 parser.
- `allowScripts` pins `esbuild@<version>`. When an update moves esbuild, move the pin with it, or npm warns on every install.
