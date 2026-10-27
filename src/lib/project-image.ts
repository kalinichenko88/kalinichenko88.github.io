import { SITE_NAME } from '../consts.ts';
import type { RepoNumbers } from './github-repo';
import { accentBar, el, IMAGE_PALETTES, ogImageSrc, type OgElement } from './og-image.ts';

type ImageProject = RepoNumbers & { name: string; tagline: string; url: string };

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
      // A 10% margin, as on the post images: platforms crop the edges.
      // Satori sizes boxes as content-box, so without border-box the padding
      // would grow the root past the canvas and push the bottom row off it.
      padding: '72px 120px',
      boxSizing: 'border-box',
      // The card surface, not the page colour: on /projects the image is the
      // whole card, and on the page colour it would melt into the page.
      backgroundColor: color.surface,
      color: color.text,
      fontFamily: 'DM Sans',
    },
    el(
      'div',
      { fontFamily: 'JetBrains Mono', fontSize: 26, color: color['text-tertiary'] },
      new URL(project.url).pathname.slice(1).replace('/', ' / ')
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
    // Sized so every count at its widest compact form ("988K") fits. The
    // language is the one value of any length, so it gives way, cut with an
    // ellipsis, and the site name keeps its place inside the margin.
    // tests/project-images.test.ts checks the margin's pixels.
    el(
      'div',
      {
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        marginTop: 'auto',
        fontSize: 24,
        color: color['text-secondary'],
      },
      ...projectStats(project).map(({ icon, label }) => {
        return stat(icon(color['text-tertiary']), label);
      }),
      project.language !== null &&
        stat(
          el('div', {
            flexShrink: 0,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: color.accent,
          }),
          project.language,
          { shrink: true }
        ),
      el(
        'div',
        { marginLeft: 'auto', flexShrink: 0, fontWeight: 600, color: color['accent-text'] },
        SITE_NAME
      )
    ),
    accentBar(color.accent)
  );
}

/**
 * The numbers the image shows, each with its icon. A zero is left out: "0
 * stars" says nothing, and the text card always hid zero stars too.
 */
export function projectStats(numbers: Pick<RepoNumbers, 'stars' | 'issues' | 'forks'>) {
  return STATS.filter(({ key }) => {
    return numbers[key] > 0;
  }).map(({ key, one, many, icon }) => {
    const count = numbers[key];

    return { icon, label: `${compact.format(count)} ${count === 1 ? one : many}` };
  });
}

/**
 * The star count as the image writes it, for the text cards and the project
 * page: "1.2K stars", or null at zero. So a project never shows two numbers.
 */
export function starLabel(stars: number): string | null {
  return projectStats({ stars, issues: 0, forks: 0 })[0]?.label ?? null;
}

// At most four characters ("988K", "1.2M"): a count grows on its own between
// builds, and a six-digit one would push the site name off the image.
const compact = new Intl.NumberFormat('en-US', { notation: 'compact' });

/** The image's path, versioned by its bytes (see ogImageSrc). */
export function projectImageSrc(
  project: ImageProject & { slug: string },
  theme: ImageTheme
): Promise<string> {
  return ogImageSrc(`/projects/${project.slug}/${theme}.png`, projectImage(project, theme));
}

/** What the image says after the name, for its alt text. */
export function projectImageAlt(project: ImageProject): string {
  const numbers = [
    ...projectStats(project).map(({ label }) => {
      return label;
    }),
    project.language,
  ];
  const shown = numbers.filter((value) => {
    return value !== null;
  });

  return shown.length > 0 ? `${project.tagline} ${shown.join(', ')}.` : project.tagline;
}

export type ImageTheme = keyof typeof IMAGE_PALETTES;

/** Every theme the image is rendered in: one route and one card image each. */
export const IMAGE_THEMES = Object.keys(IMAGE_PALETTES) as ImageTheme[];

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
        width: 26,
        height: 26,
        viewBox: '0 0 16 16',
        fill,
        children: paths.map((d) => {
          return { type: 'path', props: { d } };
        }),
      },
    };
  };
}

/** An icon and its label. With `shrink` the label gives way, cut with an ellipsis. */
function stat(icon: OgElement, label: string, { shrink = false } = {}): OgElement {
  return el(
    'div',
    { display: 'flex', alignItems: 'center', gap: 10, flexShrink: shrink ? 1 : 0, minWidth: 0 },
    icon,
    el(
      'div',
      {
        display: 'block',
        minWidth: 0,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      },
      label
    )
  );
}
