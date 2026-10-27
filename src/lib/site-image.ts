import type { ImageMetadata } from 'astro';

import { AUTHOR_NAME, ROLE, SITE_NAME } from '../consts.ts';
import {
  accentBar,
  drawingBox,
  el,
  IMAGE_PALETTES,
  ogImageSrc,
  type OgDrawing,
  type OgElement,
} from './og-image.ts';

/** What the site image draws besides the name and the role. */
export type ImageSite = {
  /** Every channel in CONTACT_LINKS order, each with its icon file's markup. */
  contacts: { label: string; handle: string; svg: string }[];
  drawing: OgDrawing;
};

/**
 * The site's 1200x630 link preview, the og:image of every page without one of
 * its own: the site name in mono, the name and the role, the site drawing on
 * the right and every channel from the footer in two columns along the bottom.
 * Rendered on every build by src/pages/site.png.ts, the post image's sibling.
 */
export function siteImage(site: ImageSite): OgElement {
  const color = IMAGE_PALETTES.light;
  // The profiles in the first column, the ways to write in the second.
  // ponytail: split by position, as the first two in CONTACT_LINKS are the
  // profiles. A channel more makes the second column a row taller, which
  // pushes the bottom row into the margin, and tests/site-image.test.ts fails.
  const columns = [site.contacts.slice(0, 2), site.contacts.slice(2)];

  return el(
    'div',
    {
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      // The same 10% margin as the post image: platforms crop the edges.
      padding: `${PADDING_Y}px ${PADDING_X}px`,
      boxSizing: 'border-box',
      backgroundColor: color.bg,
      color: color.text,
      fontFamily: 'DM Sans',
    },
    el(
      'div',
      { display: 'flex', alignItems: 'center', flex: 1 },
      el(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          alignSelf: 'flex-start',
          flex: 1,
          minWidth: 0,
          paddingRight: 40,
        },
        el(
          'div',
          { fontFamily: 'JetBrains Mono', fontSize: 26, color: color['text-tertiary'] },
          SITE_NAME
        ),
        el(
          'div',
          { marginTop: 28, fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 },
          AUTHOR_NAME
        ),
        el('div', { marginTop: 20, fontSize: 32, color: color['text-secondary'] }, ROLE)
      ),
      drawingBox(site.drawing, DRAWING_WIDTH, DRAWING_HEIGHT)
    ),
    // Under the drawing too, so a handle has the whole width.
    el(
      'div',
      {
        display: 'flex',
        gap: 64,
        marginTop: 24,
        fontFamily: 'JetBrains Mono',
        fontSize: 22,
        color: color['text-secondary'],
      },
      ...columns.map((column) => {
        return el(
          'div',
          { display: 'flex', flexDirection: 'column', gap: 14 },
          ...column.map((contact) => {
            return channel(contact, color['text-tertiary']);
          })
        );
      })
    ),
    accentBar(color.accent)
  );
}

/** The image's path, versioned by its bytes (see ogImageSrc). */
export function siteImageSrc(site: ImageSite): Promise<string> {
  return ogImageSrc('/site.png', siteImage(site));
}

/** What the image shows, for its alt text. */
export function siteImageAlt(site: ImageSite): string {
  const channels = site.contacts.map(({ label, handle }) => {
    return `${label} ${handle}`;
  });

  return `${AUTHOR_NAME}, ${ROLE}, beside ${DRAWING_ALT}. ${channels.join(', ')}.`;
}

/** What the image needs: the channels with their icons, and the site drawing. */
export function toImageSite(contacts: { label: string; handle: string }[]): ImageSite {
  // Inlined by Vite: each icon's markup, the drawing as a data: URL and its
  // size. The query keeps Astro's image pipeline off the data: URL import.
  // Inside the function, as the tests import this file outside Vite.
  const icons = import.meta.glob<string>('../assets/icons/*.svg', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  const [src] = Object.values(
    import.meta.glob<string>('../assets/images/site.png', {
      query: '?inline',
      import: 'default',
      eager: true,
    })
  );
  const [size] = Object.values(
    import.meta.glob<ImageMetadata>('../assets/images/site.png', {
      import: 'default',
      eager: true,
    })
  );

  return {
    contacts: contacts.map(({ label, handle }) => {
      // The footer finds its icon through an import; this one goes by label.
      const file = `${label.toLowerCase()}.svg`;
      const svg = icons[`../assets/icons/${file}`];
      if (!svg) {
        throw new Error(`${label}: no icon at src/assets/icons/${file}`);
      }

      return { label, handle, svg };
    }),
    drawing: { src, width: size.width, height: size.height },
  };
}

const PADDING_X = 120;
const PADDING_Y = 72;
const DRAWING_WIDTH = 360;
// What the row above the channels has room for, with three channels in the
// second column.
const DRAWING_HEIGHT = 320;
const ICON_SIZE = 24;

// The drawing in src/assets/images/site.png, made with the illustrate-post
// skill. A new drawing needs a new description here.
const DRAWING_ALT = 'a pencil sketch of an open notebook, a cup of coffee and a keyboard';

/**
 * A channel's icon and handle. The handle does not wrap, so one too long for
 * the image runs into the right margin, where the test sees it.
 */
function channel({ handle, svg }: ImageSite['contacts'][number], iconColor: string): OgElement {
  return el(
    'div',
    { display: 'flex', alignItems: 'center', gap: 12 },
    { type: 'img', props: { src: iconSrc(svg, iconColor), width: ICON_SIZE, height: ICON_SIZE } },
    el('div', { whiteSpace: 'nowrap' }, handle)
  );
}

/** The icon file as an image: an <img> has no currentColor to paint with. */
function iconSrc(svg: string, color: string): string {
  const painted = svg.replaceAll('currentColor', color);
  // An SVG read as an image file needs its namespace; the files leave it out.
  const file = painted.includes('xmlns=')
    ? painted
    : painted.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');

  return `data:image/svg+xml;base64,${Buffer.from(file).toString('base64')}`;
}
