import { SITE_NAME } from '../../consts.ts';
import type { RepoNumbers } from './github-repo';
import { projectStats, stat } from './project-stats.ts';
import {
  accentBar,
  el,
  IMAGE_PALETTES,
  ogImageSrc,
  SAFE_MARGIN,
  type OgElement,
} from '../link-previews/og-image.ts';

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
      // Satori sizes boxes as content-box, so without border-box the padding
      // would grow the root past the canvas and push the bottom row off it.
      padding: `${SAFE_MARGIN.y}px ${SAFE_MARGIN.x}px`,
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
