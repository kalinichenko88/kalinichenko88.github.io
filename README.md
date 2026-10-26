# kalinichenko.dev

Personal portfolio and blog built with [Astro 7](https://astro.build/), [Tailwind CSS 4](https://tailwindcss.com/), and TypeScript.

Live at **[kalinichenko.dev](https://kalinichenko.dev)**

## Tech Stack

- **Framework** — Astro 7 with MDX support
- **Styling** — Tailwind CSS 4 via Vite plugin + Typography plugin
- **Themes** — Light, Dark (+ Auto based on system preference)
- **Content** — Astro Content Collections (Markdown blog posts and projects)
- **Posts** — each post has a hand-drawn cover, and a 1200×630 link preview rendered at build time from its title, description and cover
- **Projects** — MDX content collection shown in a sideways row on the homepage and listed on `/projects`, each with a page of its own (`/projects/<slug>`) that shows the file's optional body and lists the posts sharing its tags; star counts, open issues, forks and language are read from GitHub at build time, with the frontmatter stars as fallback; each project gets a 1200×630 image rendered at build time, shown on its `/projects` card and as its link preview
- **Comments** — Giscus (GitHub Discussions)
- **Fonts** — DM Sans, JetBrains Mono (via Astro's built-in font optimization)
- **Linting** — ESLint + Prettier with Husky pre-commit hooks

## Getting Started

### Prerequisites

- Node.js 22.12+

### Setup

```bash
git clone https://github.com/kalinichenko88/kalinichenko88.github.io.git
cd kalinichenko88.github.io
npm install
```

No environment variables or API tokens are required.

### Development

```bash
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
```

### Checks

```bash
npm run lint       # Run ESLint
npm run lint:fix   # Auto-fix ESLint issues
npm run format     # Format with Prettier
npm run format:check  # Check formatting without writing
npm run check      # astro check (types + .astro diagnostics)
npm test           # node:test suite in tests/
npm run verify     # everything CI runs: lint, check, format:check, test, build
```

## Project Structure

```
├── content/
│   ├── posts/          # Markdown/MDX blog posts
│   └── projects/       # Project definitions and page bodies (MDX)
├── src/
│   ├── assets/         # Icons and post images (optimized by Astro)
│   ├── components/     # Astro components
│   │   └── home/       # Homepage sections
│   ├── config/         # Theme, navigation, contact channels and resume data
│   ├── content.config.ts
│   ├── consts.ts       # Site-wide constants
│   ├── lib/            # Motion controller and small helpers
│   ├── pages/          # Routes (index, blog, tags, projects, about, contact, RSS, 404)
│   └── styles/         # Global CSS and theme definitions
├── tests/              # node:test suite
└── public/             # Static assets
```

## License

This project is open source. Feel free to use it as inspiration for your own site.
