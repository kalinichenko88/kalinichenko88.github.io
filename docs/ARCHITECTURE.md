# Architecture

This file holds what the code and `CLAUDE.md` do not say: the shape of the
site, which folder plays which role, the rules that every file keeps, and the
limits on size. `CLAUDE.md` says how each feature works. `DESIGN.md` holds
the design system. This file links to them and does not repeat them.

## Bird's-eye view

kalinichenko.dev is a static site. Astro 7 builds it; GitHub Pages serves it.
There is no server, no database and no user account.

`astro build` does all the work:

1. It reads the Markdown in `content/` through the two collections in
   `src/content.config.ts`.
2. It asks the GitHub API once per project for its numbers
   (`src/lib/github-repo.ts`). On any failure it uses the frontmatter.
3. It renders each route in `src/pages/` to HTML, and each `.png.ts` route to
   a 1200x630 image through Satori and sharp.
4. It runs `checkMetaTags()` over the output and fails when a page's
   link-preview tags break a rule.

In the browser, a few scripts run on top of the static HTML: the theme
switch, the reveal on scroll, the pixel glow under the cursor, the card rows
and the giscus comments. Pages change through Astro's `ClientRouter` (View
Transitions), so each script must set itself up again after a swap (see
Patterns).

CI runs lint, `astro check`, Prettier, the tests and the build on each pull
request, and deploys `main`. A weekly run rebuilds the site so the GitHub
numbers stay fresh.

## Codemap

```
content/              Markdown: posts/ and projects/, one file per entry
src/
  pages/              one file per route: .astro renders HTML, .ts is an endpoint (PNG, RSS)
  components/         UI; home/ holds the homepage sections
  lib/                logic for the build and the browser; loads under plain node
  config/             typed lists: navigation, contacts, themes, resume
  consts.ts           site-wide constants
  content.config.ts   the two collections and their schemas
  styles/global.css   tokens, the two themes, the component classes
  assets/             icons and images, through Astro's pipeline
public/               served as is
tests/                node:test; several tests read source files as text
.claude/skills/       author tools: design-check, illustrate-post
.github/workflows/    CI: quality, build, deploy
astro.config.js       Astro config and the meta-tags build gate
```

## Modules

The folders are Astro's, by technology. The modules are by area, and each
one spans the folders. There is no `index.ts`: a module's API is the exports
of its `src/lib/` files, and a page imports them by file.

| Module        | Edge (`src/pages/`, `src/components/`)                                                  | Logic (`src/lib/`)                                   | Data                                                                   | Entry point                       |
| ------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------- |
| Posts         | `blog/`, `tags/`, `rss.xml.ts`; `PostCard`, `TableOfContents`, `YouTube`, `VideoPlayer` | `posts`, `post-image`, `reading-time`, `format-date` | `content/posts/`                                                       | `getPosts()`                      |
| Projects      | `projects/`; `ProjectCard`                                                              | `projects`, `project-image`                          | `content/projects/`, `github-repo` (the GitHub API)                    | `getProjects()`                   |
| Link previews | `Head`, `site.png.ts`                                                                   | `og-image`, `site-image`, `check-meta-tags`          | the `@fontsource` files, the drawing `src/assets/images/site.png`      | `renderOgImage()`, `ogImageSrc()` |
| Shell         | `Layout`, `Header`, `Footer`, `PixelSpotlight`, `MotionController`                      | `motion-controller`, `opaque-color`                  | `src/config/themes.ts`, `navigation.ts`, `src/consts.ts`, `global.css` | `Layout`                          |
| Home          | `index.astro`; `components/home/`                                                       |                                                      |                                                                        |                                   |
| Profile       | `about.astro`, `contact.astro`, `404.astro`                                             |                                                      | `src/config/resume.ts`, `contacts.ts`                                  |                                   |
| Authoring     | `.claude/skills/*/`, `tests/`                                                           |                                                      |                                                                        | each skill's `SKILL.md`           |

Each collection has one entry point. Pages read posts through `getPosts()`,
which sorts them newest first (I-13), and projects through `getProjects()`,
which adds the GitHub numbers once per build (I-3).

## Layers

By role, as the architecture skill defines them:

- **Edge:** `src/pages/` (one file per route), `src/components/` (markup, and
  the browser code in each `<script>`), `astro.config.js` (the build hooks)
  and the `.mjs` scripts in `.claude/skills/` (command-line tools). A page
  loads data, derives what it shows, and hands it to components.
- **Check at the edge:** `src/content.config.ts`. The zod schema of each
  collection validates the frontmatter once, when Astro loads it, so every
  page sees typed data. The GitHub response is checked in `github-repo.ts`,
  where it enters. The build's own output is checked after the fact by
  `src/lib/check-meta-tags.ts`.
- **Logic:** `src/lib/`. Most files are build-time functions that take data
  and return an element tree, a path, a label or a number.
  `motion-controller.ts` and `opaque-color.ts` run in the browser, imported
  by a component's `<script>`. No file there imports a component or a page
  (I-2), and each one loads under plain node (I-5).
- **Data:** `content/` (Markdown, through `astro:content`); `src/config/` and
  `src/consts.ts` (static data as typed TypeScript); `src/lib/github-repo.ts`
  (the one network client, I-1); `src/assets/` (through Astro's image
  pipeline) and `public/` (served as is).

Dependencies point down: `src/pages/` to `src/components/` to `src/lib/` to
`src/config/` and `src/consts.ts`. Components import components, lib,
config and consts. Lib imports lib and consts. Config imports consts and
icons. Nothing imports upward; I-2 checks it for lib, config and the two root
files. `tests/` imports `src/lib/`, `src/config/`, `src/consts.ts`
and the skills' `.mjs` files, and reads `.astro` and `.css` files as text.

## Patterns

Only the ones that the code keeps everywhere and that are not obvious.

- **A build-time image is a pair.** The layout is a function in
  `src/lib/<kind>-image.ts` that returns an element tree. The route is a
  `.png.ts` file in `src/pages/`, which calls `renderOgImage()` on that
  tree. A page links the image only through the same lib file's
  `<kind>ImageSrc()`, which adds `?v=<hash>`. The detail is in `CLAUDE.md`,
  under Project images and Post covers.
- **`src/lib/` runs under plain node.** `npm test` loads it with
  `--experimental-strip-types` and no bundler. So a file there writes `.ts`
  on each local import it needs at run time, and imports from `astro:*` only
  as a type. `projects.ts` and `posts.ts` are the exceptions: each reads its
  collection, and only pages call them (`ProjectCard` imports a type from
  `projects.ts`).
- **Browser code splits by testability.** DOM wiring stays in the component's
  `<script>` (`Header`, `CardRow`, `VideoPlayer`, `PixelSpotlight`, the TOC
  observer in the post page). The part that a node test can run without a DOM
  goes to `src/lib/` (`opaque-color.ts`). `motion-controller.ts` is the
  exception: it holds the reveal's DOM wiring too, and only its `onScreen()`
  is DOM-free.
- **Every browser script survives a page swap.** A module `<script>` runs
  once, so it runs its init again on `astro:after-swap`. A custom element
  (`card-row`, `video-player`) carries its listeners with the element instead.
  `PixelSpotlight` needs neither: its listeners are on `window` and
  `document`, and it writes only to `<html>`.
  The `is:inline` scripts in `Layout` set root attributes again on
  `astro:before-swap`. An `is:inline` script cannot import, so it reads its
  constants from `data-*` attributes.
- **A rule about markup or CSS is a text test.** A test in `tests/` reads an
  `.astro` or `.css` file as a string and asserts on it (`reading-veil`,
  `motion-css`, `motion-page-coverage`, `post-covers`). A new
  rule of that kind goes there, not into a lint plugin or a browser test.
  `tests/design-check.test.ts` runs the design-check script the same way.
- **One list, every surface.** A list that the site renders is a typed array
  in `src/config/` (`NAV_LINKS`, `CONTACT_LINKS`, `THEME_OPTIONS`,
  `WORK_HISTORY`), and each surface that shows it renders it from there. See
  `CLAUDE.md`, Key Patterns, Contact channels.

## Invariants

Each one has a statement and, when a grep or a count says it, a `Check:`
line that `invariants.sh` of the architecture skill runs. An invariant with
no `Check:` line names the test that keeps it.

- **I-1.** Only `src/lib/github-repo.ts` calls `fetch`: it is the build's one
  network client. The browser loads giscus, YouTube and the analytics beacon
  by URL, not through `fetch`.
  Check: grep `fetch\(` in `src/` `tests/` `.claude/` `astro.config.js` except `src/lib/github-repo.ts`.
- **I-2.** Dependencies point down: nothing in `src/lib/`, `src/config/`,
  `src/consts.ts` or `src/content.config.ts` imports a component or a page,
  and nothing in the last three imports from `src/lib/`.
  Check: grep `from '\.{1,2}/(components|pages|lib)/` in `src/lib/` `src/config/` `src/consts.ts` `src/content.config.ts`.
- **I-3.** Pages read projects only through `getProjects()`, so every project
  card and image carries the same GitHub numbers.
  Check: grep `get(Collection|Entry|Entries)\(['"]projects` in `src/` except `src/lib/projects.ts`.
- **I-4.** One renderer makes the link-preview images: only
  `src/lib/og-image.ts` imports Satori and the font files.
  Check: grep `from 'satori'|@fontsource` in `src/` except `src/lib/og-image.ts`.
- **I-5.** `src/lib/` runs under plain node: a file there imports a value
  from `astro:*` only in `projects.ts` and `posts.ts`, the two collection
  readers.
  Check: grep `^import (\{|[a-zA-Z_]+ from|\* as).*'astro:` in `src/lib/` except `src/lib/projects.ts` `src/lib/posts.ts`.
  ADR: 0002.
- **I-6.** An object shape is a `type`. `interface` appears only inside a
  `declare global` block, as in `MotionController.astro`.
  The pattern allows two spaces of indent, the indent of a component's
  `<script>`.
  Check: grep `^ {0,2}(export )?interface ` in `src/` `tests/` `.claude/`.
- **I-7.** The theme ids are written once, in `src/config/themes.ts`. The
  selectors in `global.css` and the design-check script, which verifies that
  the ids stay, are the only other literals. The giscus script in the post
  page still holds them and is known debt.
  Check: grep `['"]cloud(-dark)?['"]` in `src/` `tests/` `.claude/` except `src/config/themes.ts` `src/styles/global.css` `.claude/skills/design-check/check-design.mjs` debt `src/pages/blog/[...id].astro`.
- **I-8.** No code file in `src/`, `tests/`, `.claude/` or the two root
  config files has more than 180 lines. `global.css` is out: tokens and
  component classes do not split like code.
  Check: lines 180 in `src/` `tests/` `.claude/` `astro.config.js` `eslint.config.js` except `src/styles/global.css`.
  debt `src/lib/check-meta-tags.ts`
  debt `src/pages/blog/[...id].astro`
  debt `src/components/Header.astro`
  debt `.claude/skills/design-check/check-design.mjs`
  debt `src/lib/project-image.ts`
  debt `tests/project-images.test.ts`
  debt `src/lib/site-image.ts`
- **I-9.** No folder in `src/`, `tests/` or `.claude/` holds more than 10
  code files of its own.
  Check: files 10 in `src/` `tests/` `.claude/` debt `src/components/` `tests/` `src/lib/`.
- **I-10.** Running text on the open field sits on `.reading-veil`.
  `tests/reading-veil.test.ts` holds the list of surfaces and fails without
  the class.
- **I-11.** Every content page opts its major blocks into reveal with
  `data-reveal`, and rendered prose never carries it.
  `tests/motion-page-coverage.test.ts` keeps both.
- **I-12.** No code imports from a `models/` or a `schemas/` folder: a shared
  type stays in the file that exports its values.
  Check: grep `from '[^']*/(models|schemas)/` in `src/` `tests/`.
  ADR: 0001.
- **I-13.** Pages read posts only through `getPosts()`, so every list,
  feed and image sees the same posts in the same order.
  Check: grep `get(Collection|Entry|Entries)\(['"]posts` in `src/` except `src/lib/posts.ts`.
  ADR: 0002.

## Limits

The numbers come from the tree at commit `1ad6125`, by the rule of the
architecture skill: the size that 90% of the code files, and 90% of the
folders, stay under, rounded up. Code is every tracked text file that the
debt skill's `data.ere` does not match. Markdown, JSON, YAML, SVG and
fixtures are not code. MDX is code by that rule: the five `.mdx` files (one
post and four projects) count in the numbers below, and no check reads them.

- Lines per file: 72 code files. The 90th percentile is 179 lines; the limit
  is 180 (I-8). Seven files are over it. `global.css` (909 lines) is out of
  the check; the other six start on the `debt` list.
- Code files per folder: 20 folders hold code files of their own. The 90th
  percentile is 10; the limit is 10 (I-9). `src/components/` (11) and
  `tests/` (14) start on the `debt` list.
- The site image (#91) came in while this file was in review. It added
  `src/lib/site-image.ts` (192 lines) and an eleventh file in `src/lib/`, so
  both start on the `debt` lists too. On that tree the 90th percentiles are
  192 lines and 11 files.

A path leaves the list when it drops under the limit. A path joins it only
in a pull request that files its debt issue. A new number needs an ADR. The
rules for a split are in the architecture skill, under Decomposition.

## Cross-cutting concerns

- **Theme.** `data-theme` on `<html>`, set before the first paint by the
  inline script in `Layout`. The tokens are in `global.css`; the images carry
  a copy in `IMAGE_PALETTES`, kept in step by `tests/project-images.test.ts`.
  See `CLAUDE.md`, Theme System and Key Patterns.
- **Meta tags.** `Head.astro` writes them; `check-meta-tags.ts` checks the
  built pages. The rules are listed in `CLAUDE.md`, Key Patterns, Meta tags.
- **Motion and the pixel field.** `data-reveal` and `.reading-veil`.
  `DESIGN.md`, Interaction, has the why; `CLAUDE.md`, Components and Section
  Backgrounds, has the how.
- **Fonts, twice.** The CSS gets DM Sans and JetBrains Mono from Google
  through Astro's `fonts` config. Satori gets the static files from
  `@fontsource`, because it draws a variable font at one weight only.
- **Formatting.** Prettier runs on each file that Claude Code writes or edits
  (`.claude/hooks/format.sh`), and on commit for the file types that
  `lint-staged` in `package.json` lists. CI's `format:check` reads every
  file, so a format error that both miss fails CI.
- **CI.** `.github/workflows/astro.yml`. The quality job runs lint, check,
  format and the tests; the build job runs with the workflow's GitHub token;
  the deploy job runs only from `main`.

## ADRs

They go to `docs/adr/NNNN-title.md`, one decision per file, and each
accepted one gets a line here.

- [0001](adr/0001-types-stay-with-their-producer.md) A shared type stays in
  the file that produces it; the zod schemas stay in `src/content.config.ts`.
- [0002](adr/0002-posts-have-one-entry-point.md) Pages read posts through
  `getPosts()` in `src/lib/posts.ts`, the second collection reader in
  `src/lib/`.
