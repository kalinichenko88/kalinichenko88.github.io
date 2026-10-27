import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori, { type Font } from 'satori';
import sharp from 'sharp';

/**
 * Renders an element tree to a 1200x630 PNG, the size link previews use, in
 * the site's fonts. Satori lays the tree out with flexbox and draws the text
 * as paths, so sharp needs no fonts installed to turn it into a PNG: the CI
 * runner has none. The project and post images both render through it.
 *
 * Rendered once per tree per process, so the PNG route and the pages that put
 * a hash of it in their URL get the same bytes from one render. A failed render
 * is not kept: the next call renders again.
 */
export function renderOgImage(element: OgElement): Promise<Buffer> {
  // A hash, not the JSON: a post's tree holds its whole cover as a data: URL,
  // about 700 KB, and dev keeps one entry for each edit of the text.
  const key = createHash('sha1').update(JSON.stringify(element)).digest('hex');
  let png = rendered.get(key);
  if (!png) {
    rendered.set(key, (png = render(element)));
    // A failed render is not kept, so the next request (in dev) tries again.
    png.catch(() => rendered.delete(key));
  }
  return png;
}

const rendered = new Map<string, Promise<Buffer>>();

/**
 * The image's path, with a hash of its PNG: browsers and link previews cache an
 * image by its URL, so any change to the bytes, from a number to a font file or
 * a library update, needs a new one, and an unchanged image keeps its old one.
 */
export async function ogImageSrc(path: string, element: OgElement): Promise<string> {
  const png = await renderOgImage(element);
  const version = createHash('sha1').update(png).digest('hex').slice(0, 8);

  return `${path}?v=${version}`;
}

async function render(element: OgElement): Promise<Buffer> {
  const svg = await satori(element, { width: 1200, height: 630, fonts: await fonts() });
  // ponytail: always a 256-colour palette PNG, which looks the same as
  // truecolour on flat colours, text and the post covers (themselves 256-colour
  // drawings) at under half the size. A caller with a gradient or a photo needs
  // an option for truecolour first.
  return sharp(Buffer.from(svg)).png({ palette: true }).toBuffer();
}

/** React's element shape, which Satori reads, without React. */
export type OgElement = {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: OgChild | OgChild[];
    [attribute: string]: unknown;
  };
};

type OgChild = OgElement | string | false;

/** An element with a style and children, the one shape both images build from. */
export function el(
  type: string,
  style: Record<string, string | number>,
  ...children: OgChild[]
): OgElement {
  return { type, props: { style, children } };
}

/** A drawing as an image takes it: a data: URL and the file's own size. */
export type OgDrawing = { src: string; width: number; height: number };

/** The drawing, whole, scaled down into a box of this size and centred in it. */
export function drawingBox(drawing: OgDrawing, width: number, height: number): OgElement {
  const scale = Math.min(width / drawing.width, height / drawing.height);

  return el(
    'div',
    {
      display: 'flex',
      flexShrink: 0,
      width,
      height,
      alignItems: 'center',
      justifyContent: 'center',
    },
    {
      type: 'img',
      props: {
        src: drawing.src,
        // Rounded down, so the drawing never spills a pixel past its box.
        width: Math.floor(drawing.width * scale),
        height: Math.floor(drawing.height * scale),
      },
    }
  );
}

/** The 14px accent bar along the bottom edge, which every image ends on. */
export function accentBar(color: string): OgElement {
  return el('div', {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 14,
    backgroundColor: color,
  });
}

/**
 * The theme tokens the images use, copied from global.css because Satori cannot
 * read CSS variables. tests/project-images.test.ts keeps the copies in step.
 */
export const IMAGE_PALETTES = {
  light: {
    bg: '#f4f2ee',
    surface: '#ffffff',
    text: '#232326',
    'text-secondary': '#55555b',
    'text-tertiary': '#68686e',
    accent: '#c25a34',
    'accent-text': '#a94a29',
  },
  dark: {
    surface: '#232326',
    text: '#ececed',
    'text-secondary': '#a6a6ac',
    'text-tertiary': '#8f8f95',
    accent: '#e07a52',
    'accent-text': '#e07a52',
  },
};

const require = createRequire(import.meta.url);

// Read for each render, with no cache: four small local files cost nothing,
// and a cache would keep a failed read until a restart.
//
// Static weights from Fontsource, not the files Astro's `fonts` config gets
// from Google: Google serves DM Sans as a variable font, and Satori draws a
// variable font only at its default weight, so every heading would be 400.
//
// ponytail: the latin subset only, so a glyph outside it (an arrow, Cyrillic,
// an emoji) draws as nothing. tests/project-images.test.ts holds the project
// names and taglines, as the frontmatter writes them, to ASCII, Latin-1 and the
// usual dashes and quotes; the GitHub language is not checked. Load another
// subset, or pass Satori a loadAdditionalAsset, before the text needs more.
function fonts() {
  return Promise.all([
    font('dm-sans', 'DM Sans', 400),
    font('dm-sans', 'DM Sans', 600),
    font('dm-sans', 'DM Sans', 700),
    font('jetbrains-mono', 'JetBrains Mono', 400),
  ]);
}

async function font(slug: string, name: string, weight: Font['weight']): Promise<Font> {
  const file = require.resolve(`@fontsource/${slug}/files/${slug}-latin-${weight}-normal.woff2`);

  return { name, weight, style: 'normal', data: await readFile(file) };
}
