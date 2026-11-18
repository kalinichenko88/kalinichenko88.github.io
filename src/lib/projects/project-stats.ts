import { el, type OgElement } from '../link-previews/og-image.ts';
import type { RepoNumbers } from './github-repo';

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

/** An icon and its label. With `shrink` the label gives way, cut with an ellipsis. */
export function stat(icon: OgElement, label: string, { shrink = false } = {}): OgElement {
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

// At most four characters ("988K", "1.2M"): a count grows on its own between
// builds, and a six-digit one would push the site name off the image.
const compact = new Intl.NumberFormat('en-US', { notation: 'compact' });

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
