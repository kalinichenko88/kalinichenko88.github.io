import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori, { type Font } from 'satori';
import sharp from 'sharp';

/**
 * Renders an element tree to a 1200x630 PNG, the size link previews use, in
 * the site's fonts. Satori lays the tree out with flexbox and draws the text
 * as paths, so sharp needs no fonts installed to turn it into a PNG: the CI
 * runner has none. Not tied to projects, so other social images can use it.
 */
export async function renderOgImage(element: OgElement): Promise<Buffer> {
  const svg = await satori(element, { width: 1200, height: 630, fonts: await fonts() });
  // Flat colours and text: a palette PNG looks the same at under half the size.
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

// Static weights from Fontsource, not the files Astro's `fonts` config gets
// from Google: Google serves DM Sans as a variable font, and Satori draws a
// variable font only at its default weight, so every heading would be 400.
const require = createRequire(import.meta.url);
let loaded: Promise<Font[]> | undefined;

function fonts() {
  return (loaded ??= Promise.all([
    font('dm-sans', 'DM Sans', 400),
    font('dm-sans', 'DM Sans', 600),
    font('dm-sans', 'DM Sans', 700),
    font('jetbrains-mono', 'JetBrains Mono', 400),
  ]));
}

async function font(slug: string, name: string, weight: Font['weight']): Promise<Font> {
  const file = require.resolve(`@fontsource/${slug}/files/${slug}-latin-${weight}-normal.woff2`);

  return { name, weight, style: 'normal', data: await readFile(file) };
}
