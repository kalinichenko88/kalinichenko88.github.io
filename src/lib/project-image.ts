import { SITE_NAME } from '../consts.ts';
import type { RepoNumbers } from './github-repo';
import type { OgElement } from './og-image';

type ImageProject = RepoNumbers & { name: string; tagline: string; url: string };
type Numbers = Pick<RepoNumbers, 'stars' | 'issues' | 'forks'>;

/**
 * A project's 1200x630 image, like the social preview GitHub makes for a repo:
 * its path, name and tagline, and its numbers from GitHub. Rendered at build
 * time by src/pages/projects/[slug]/[theme].png.ts, once per theme.
 */
export function projectImage(project: ImageProject, theme: ImageTheme): OgElement {
  const color = IMAGE_PALETTES[theme];

  return el(
    'div',
    {
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      // A 10% margin, as on the post social images: platforms crop the edges.
      // Satori sizes boxes as content-box, so without border-box the padding
      // would grow the root past the canvas and push the bottom row off it.
      padding: '72px 120px',
      boxSizing: 'border-box',
      backgroundColor: color.bg,
      color: color.text,
      fontFamily: 'DM Sans',
    },
    el(
      'div',
      { fontFamily: 'JetBrains Mono', fontSize: 26, color: color['text-tertiary'] },
      project.url.replace('https://github.com/', '').replace('/', ' / ')
    ),
    el(
      'div',
      {
        display: 'block',
        lineClamp: 2,
        margin: '28px 0 24px',
        fontSize: 76,
        fontWeight: 700,
        lineHeight: 1.05,
        letterSpacing: -1.5,
      },
      project.name
    ),
    el(
      'div',
      {
        display: 'block',
        lineClamp: 3,
        maxWidth: 900,
        fontSize: 32,
        lineHeight: 1.35,
        color: color['text-secondary'],
      },
      project.tagline
    ),
    // ponytail: the row does not shrink. With every number at four digits the
    // site name reaches into the right margin; drop the gap or the name then.
    el(
      'div',
      {
        display: 'flex',
        alignItems: 'center',
        gap: 44,
        marginTop: 'auto',
        fontSize: 28,
        color: color['text-secondary'],
      },
      ...projectStats(project).map(({ icon, label }) => {
        return stat(icon(color['text-tertiary']), label);
      }),
      project.language !== null &&
        stat(
          el('div', { width: 22, height: 22, borderRadius: 11, backgroundColor: color.accent }),
          project.language
        ),
      el('div', { marginLeft: 'auto', fontWeight: 600, color: color['accent-text'] }, SITE_NAME)
    ),
    el('div', {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 14,
      backgroundColor: color.accent,
    })
  );
}

/**
 * The numbers the image shows, each with its icon. A zero is left out: "0
 * stars" says nothing, and the text card always hid zero stars too.
 */
export function projectStats(numbers: Numbers) {
  return STATS.filter(({ key }) => numbers[key] > 0).map(({ key, one, many, icon }) => {
    const count = numbers[key];

    return { icon, label: `${count} ${count === 1 ? one : many}` };
  });
}

/** What the image says after the name, for its alt text. */
export function projectImageAlt(project: ImageProject): string {
  const numbers = [...projectStats(project).map(({ label }) => label), project.language];
  const shown = numbers.filter((value) => value !== null);

  return shown.length > 0 ? `${project.tagline} ${shown.join(', ')}.` : project.tagline;
}

/**
 * The theme tokens the image uses, copied from global.css because Satori cannot
 * read CSS variables. tests/project-images.test.ts keeps the copies in step.
 */
export const IMAGE_PALETTES = {
  light: {
    bg: '#f4f2ee',
    text: '#232326',
    'text-secondary': '#55555b',
    'text-tertiary': '#68686e',
    accent: '#c25a34',
    'accent-text': '#a94a29',
  },
  dark: {
    bg: '#1a1a1c',
    text: '#ececed',
    'text-secondary': '#a6a6ac',
    'text-tertiary': '#8f8f95',
    accent: '#e07a52',
    'accent-text': '#e07a52',
  },
};

export type ImageTheme = keyof typeof IMAGE_PALETTES;

// Paths from GitHub's Octicons (MIT), drawn on a 16x16 grid.
const STATS = [
  {
    key: 'stars',
    one: 'star',
    many: 'stars',
    icon: octicon(
      'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z'
    ),
  },
  {
    key: 'issues',
    one: 'issue',
    many: 'issues',
    icon: octicon(
      'M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
      'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z'
    ),
  },
  {
    key: 'forks',
    one: 'fork',
    many: 'forks',
    icon: octicon(
      'M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z'
    ),
  },
] as const;

function octicon(...paths: string[]) {
  return (fill: string): OgElement => {
    return {
      type: 'svg',
      props: {
        width: 30,
        height: 30,
        viewBox: '0 0 16 16',
        fill,
        children: paths.map((d) => {
          return { type: 'path', props: { d } };
        }),
      },
    };
  };
}

function stat(icon: OgElement, label: string): OgElement {
  return el(
    'div',
    { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, whiteSpace: 'nowrap' },
    icon,
    label
  );
}

function el(
  type: string,
  style: Record<string, string | number>,
  ...children: (OgElement | string | false)[]
): OgElement {
  return { type, props: { style, children } };
}
