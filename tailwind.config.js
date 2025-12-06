export default {
  content: ['./src/**/*.{astro,html,js,ts,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: 'rgb(var(--color-background) / <alpha-value>)',
        fg: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        accentSoft: 'rgb(var(--color-accent-soft) / <alpha-value>)',
      },
      maxWidth: {
        prose: '768px',
        container: '992px',
      },
    },
  },
};
