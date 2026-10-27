import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

import * as consts from '../src/consts.ts';
import { IMAGE_PALETTES, renderOgImage } from '../src/lib/og-image.ts';
import { siteImage, siteImageAlt, type ImageSite } from '../src/lib/site-image.ts';

// The site image, rendered at build time by src/pages/site.png.ts: the
// og:image of every page without one of its own.
async function site(): Promise<ImageSite> {
  return { contacts: await contacts(), drawing: await drawing() };
}

// The channels as src/config/contacts.ts lists them, in its order, each with
// its icon file. That file imports the SVGs, which only Vite reads, so its
// text is read here instead.
async function contacts(): Promise<ImageSite['contacts']> {
  const source = await readFile(new URL('../src/config/contacts.ts', import.meta.url), 'utf8');
  const entries = [...source.matchAll(/label: '([^']+)',\s*handle: (?:'([^']+)'|(\w+))/g)];
  assert.ok(entries.length > 0, 'no channel found in src/config/contacts.ts');

  return Promise.all(
    entries.map(async ([, label, handle, constant]) => {
      const icon = new URL(`../src/assets/icons/${label.toLowerCase()}.svg`, import.meta.url);

      return {
        label,
        handle: handle ?? String(consts[constant as keyof typeof consts]),
        svg: await readFile(icon, 'utf8'),
      };
    })
  );
}

async function drawing(): Promise<ImageSite['drawing']> {
  const png = await readFile(new URL('../src/assets/images/site.png', import.meta.url));
  const { width = 0, height = 0 } = await sharp(png).metadata();

  return { src: `data:image/png;base64,${png.toString('base64')}`, width, height };
}

test('the site image renders as a 1200x630 palette PNG', async () => {
  const png = await renderOgImage(siteImage(await site()));
  const { format, width, height, isPalette } = await sharp(png).metadata();
  assert.deepEqual([format, width, height], ['png', 1200, 630]);
  assert.ok(isPalette, 'not a palette PNG');
});

// Platforms crop the edges of a link preview, so nothing may be drawn in the
// 10% right margin (x 1080 on) or in the bottom margin above the accent bar
// (y 560 to 616). A handle does not wrap, so one too long for its column runs
// into the right margin, and a channel too many pushes the bottom row down.
test('the name, the role and every channel stay inside the safe area', async () => {
  const png = await renderOgImage(siteImage(await site()));
  const bg = Buffer.from(IMAGE_PALETTES.light.bg.slice(1), 'hex');
  const margins = {
    right: { left: 1080, top: 0, width: 120, height: 616 },
    bottom: { left: 0, top: 560, width: 1200, height: 56 },
  };
  for (const [name, region] of Object.entries(margins)) {
    // Raw pixels: sharp's stats() reads the whole input and ignores extract().
    const { data, info } = await sharp(png)
      .extract(region)
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      assert.ok(data.subarray(i, i + 3).equals(bg), `drawn in the ${name} margin`);
    }
  }
});

// The fonts carry the latin subset only, and Satori draws a glyph outside it
// as nothing, with no error.
test('every handle is in the image font subset', async () => {
  for (const { label, handle } of await contacts()) {
    assert.match(handle, /^[\u0020-\u007e\u00a0-\u00ff]*$/, label);
  }
});

test('the alt text names every channel the image shows', async () => {
  const value = await site();
  const alt = siteImageAlt(value);
  for (const { label, handle } of value.contacts) {
    assert.ok(alt.includes(`${label} ${handle}`), `${label} is not in the alt`);
  }
  // X's limit, which the build checks too.
  assert.ok(alt.length <= 420, `${alt.length} characters`);
});

test('a page without an image of its own falls back to the rendered site image', async () => {
  const head = await readFile(new URL('../src/components/Head.astro', import.meta.url), 'utf8');
  assert.match(head, /siteImageSrc\(/);
  assert.match(head, /siteImageAlt\(/);
  assert.doesNotMatch(head, /\.og\.jpg/, 'Head still reads a social image file');
});
