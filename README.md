# kalinichenko.dev

Personal blog built with [Astro 5](https://astro.build/), [Tailwind CSS 4](https://tailwindcss.com/), and TypeScript.

Live at **[kalinichenko.dev](https://kalinichenko.dev)**

## Tech Stack

- **Framework** — Astro 5 with MDX support
- **Styling** — Tailwind CSS 4 via Vite plugin + Typography plugin
- **Themes** — Light, Dark, Terminal (+ Auto based on system preference)
- **Content** — Astro Content Collections (Markdown blog posts, YAML projects)
- **GitHub Repos** — Fetched at build time via Octokit
- **Comments** — Giscus (GitHub Discussions)
- **Fonts** — General Sans, DM Sans, JetBrains Mono
- **Linting** — ESLint + Prettier with Husky pre-commit hooks

## Getting Started

### Prerequisites

- Node.js 18+
- A [GitHub personal access token](https://github.com/settings/tokens) for fetching repositories

### Setup

```bash
git clone https://github.com/kalinichenko88/kalinichenko88.github.io.git
cd kalinichenko88.github.io
npm install
```

Create a `.env` file in the project root:

```
GITHUB_TOKEN=your_github_token_here
```

### Development

```bash
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build
npm run preview    # Preview production build
```

### Linting & Formatting

```bash
npm run lint       # Run ESLint
npm run lint:fix   # Auto-fix ESLint issues
npm run format     # Format with Prettier
```

## Project Structure

```
├── content/
│   ├── posts/          # Markdown blog posts
│   └── projects/       # YAML project definitions
├── src/
│   ├── components/     # Astro components
│   ├── config/         # Theme configuration
│   ├── content.config.ts
│   ├── consts.ts       # Site-wide constants
│   ├── layouts/        # Page layouts
│   ├── loaders/        # Custom Astro content loaders (GitHub repos)
│   ├── pages/          # Routes (index, blog, tags, about, RSS, 404)
│   └── styles/         # Global CSS and theme definitions
└── public/             # Static assets
```

## License

This project is open source. Feel free to use it as inspiration for your own site.
