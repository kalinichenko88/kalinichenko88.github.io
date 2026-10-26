import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori, { type Font } from 'satori';
import sharp from 'sharp';

/**
 * Renders an element tree to a 1200x630 PNG, the size link previews use, in
 * the site's fonts. Satori lays the tree out with flexbox and draws the text
 * as paths, so sharp needs no fonts installed to turn it into a PNG: the CI
 * runner has none. Not tied to projects, so other social images can use it.
 *
 * Rendered once per tree per process, so the PNG route and the pages that put
 * a hash of it in their URL get the same bytes from one render. A failed render
 * is not kept: the next call renders again.
 */
export function renderOgImage(element: OgElement): Promise<Buffer> {
  const key = JSON.stringify(element);
  let png = rendered.get(key);
  if (!png) {
    rendered.set(key, (png = render(element)));
    // A failed render is not kept, so the next request (in dev) tries again.
    png.catch(() => rendered.delete(key));
  }
  return png;
}

const rendered = new Map<string, Promise<Buffer>>();

async function render(element: OgElement): Promise<Buffer> {
  const svg = await satori(element, { width: 1200, height: 630, fonts: await fonts() });
  // ponytail: always a 256-colour palette PNG, which looks the same as
  // truecolour on flat colours and text at under half the size. A caller with
  // a gradient, a photo or a drawing needs an option for truecolour first.
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
