import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

/**
 * Renders an element tree to a 1200x630 PNG, the size link previews use, in
 * the site's fonts. Satori lays the tree out with flexbox and draws the text
 * as paths, so sharp needs no fonts installed to turn it into a PNG: the CI
 * runner has none. Not tied to projects, so other social images can use it.
 */
export async function renderOgImage(element: OgElement): Promise<Buffer> {
  const svg = await satori(element, { width: 1200, height: 630, fonts: await fonts() });
  return sharp(Buffer.from(svg)).png().toBuffer();
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
const FONT_FILES = [
  {
    name: 'DM Sans',
    weight: 400,
    file: '@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2',
  },
  {
    name: 'DM Sans',
    weight: 600,
    file: '@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2',
  },
  {
    name: 'DM Sans',
    weight: 700,
    file: '@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2',
  },
  {
    name: 'JetBrains Mono',
    weight: 400,
    file: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
  },
] as const;

const require = createRequire(import.meta.url);
let loaded: ReturnType<typeof loadFonts> | undefined;

function fonts() {
  return (loaded ??= loadFonts());
}

function loadFonts() {
  return Promise.all(
    FONT_FILES.map(async ({ name, weight, file }) => ({
      name,
      weight,
      style: 'normal' as const,
      data: await readFile(require.resolve(file)),
    }))
  );
}
