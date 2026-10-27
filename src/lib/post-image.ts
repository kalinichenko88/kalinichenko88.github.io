import type { CollectionEntry } from 'astro:content';

import { SITE_NAME } from '../consts.ts';
import { formatDate } from './format-date.ts';
import {
  accentBar,
  drawingBox,
  el,
  IMAGE_PALETTES,
  ogImageSrc,
  type OgDrawing,
  type OgElement,
} from './og-image.ts';
import { readingTime } from './reading-time.ts';

/** What a post's image draws: its text, and its cover as a data: URL. */
export type ImagePost = {
  title: string;
  description: string;
  pubDate: Date;
  minutesRead: number;
  cover: OgDrawing;
};

/**
 * A post's 1200x630 link preview, the project image's sibling: the blog path in
 * mono, the title, the description, the date and reading time, the cover
 * drawing on the right and the accent bar. Rendered on every build by
 * src/pages/blog/[id].png.ts, so the text is always the frontmatter's.
 */
export function postImage(post: ImagePost): OgElement {
  const color = IMAGE_PALETTES.light;

  return el(
    'div',
    {
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      // The same 10% margin as the project image: platforms crop the edges.
      padding: `${PADDING_Y}px ${PADDING_X}px`,
      boxSizing: 'border-box',
      backgroundColor: color.bg,
      color: color.text,
      fontFamily: 'DM Sans',
    },
    el(
      'div',
      { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: 40 },
      el(
        'div',
        { fontFamily: 'JetBrains Mono', fontSize: 26, color: color['text-tertiary'] },
        `${SITE_NAME} / blog`
      ),
      el(
        'div',
        { display: 'flex', flexDirection: 'column', gap: 20, marginTop: 28 },
        el(
          'div',
          {
            display: 'block',
            lineClamp: 4,
            fontSize: titleSize(post.title),
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1,
          },
          post.title
        ),
        // 125 characters at most (MAX_DESCRIPTION) take three lines;
        // the fourth is room for wide letters.
        el(
          'div',
          {
            display: 'block',
            lineClamp: 4,
            fontSize: 26,
            lineHeight: 1.35,
            color: color['text-secondary'],
          },
          post.description
        )
      ),
      el(
        'div',
        {
          display: 'flex',
          gap: 28,
          marginTop: 'auto',
          fontFamily: 'JetBrains Mono',
          fontSize: 22,
          color: color['text-tertiary'],
        },
        el('div', {}, formatDate(post.pubDate, { month: 'long' })),
        el('div', {}, `${post.minutesRead} min read`)
      )
    ),
    // The cover, whole, in a box on the right that ends at the right margin.
    drawingBox(post.cover, DRAWING_WIDTH, 630 - 2 * PADDING_Y),
    accentBar(color.accent)
  );
}

/** The image's path, versioned by its bytes (see ogImageSrc). */
export function postImageSrc(id: string, post: ImagePost): Promise<string> {
  return ogImageSrc(`/blog/${id}.png`, postImage(post));
}

/** What the image needs from a post, or undefined for a draft with no cover. */
export function toImagePost(post: CollectionEntry<'posts'>): ImagePost | undefined {
  const { cover } = post.data;
  if (!cover) {
    return undefined;
  }

  // Each cover as a data: URL for Satori, inlined by Vite. The query keeps
  // Astro's image pipeline off these imports. Inside the function, as the
  // tests import this file outside Vite. tests/post-covers.test.ts keeps every
  // cover at covers/<post-id>.png.
  const covers = import.meta.glob<string>('../assets/images/covers/*.png', {
    query: '?inline',
    import: 'default',
    eager: true,
  });
  const src = covers[`../assets/images/covers/${post.id}.png`];
  // Satori's own error names no post: "Image source is not provided".
  if (!src) {
    throw new Error(`${post.id}: no cover at src/assets/images/covers/${post.id}.png`);
  }

  return {
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    minutesRead: readingTime(post.body ?? ''),
    cover: { src, width: cover.width, height: cover.height },
  };
}

const PADDING_X = 120;
const PADDING_Y = 72;
const DRAWING_WIDTH = 360;

// Steps down with length, so every title so far (57 characters at most) fits
// in three lines. The clamp cuts any title after four lines, which at these
// sizes takes wide capitals or about twice the longest title so far.
function titleSize(title: string): number {
  if (title.length <= 40) {
    return 54;
  }

  return title.length <= 60 ? 48 : 42;
}
