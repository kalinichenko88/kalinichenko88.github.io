import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

import * as consts from '../src/consts.ts';
import { IMAGE_PALETTES, renderOgImage, type OgElement } from '../src/lib/og-image.ts';
import {
  inlinedDrawing,
  siteImage,
  siteImageAlt,
  siteImageSrc,
  type ImageSite,
} from '../src/lib/site-image.ts';

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
  // A handle is a quoted string or a constant from consts.ts, and nothing after
  // it: `CONST.trim()` is no match, as the value drawn is not the constant's.
  const entries = [
    ...source.matchAll(/label: '([^']+)',\s*handle: (?:'([^']+)'|(\w+))(?=\s*[,}])/g),
  ];
  // Every entry has an Icon, so a count below theirs is an entry written in a
  // shape the pattern misses, which the image would draw and this test not.
  const icons = source.match(/\bIcon: [A-Z]\w*/g) ?? [];
  assert.ok(entries.length > 0, 'no channel found in src/config/contacts.ts');
  assert.equal(entries.length, icons.length, 'a channel in contacts.ts the pattern misses');

  return Promise.all(
    entries.map(async ([, label, quoted, constant]) => {
      const handle = quoted ?? consts[constant as keyof typeof consts];
      assert.equal(typeof handle, 'string', `${label}: ${constant} is not a string in consts.ts`);
      const icon = new URL(`../src/assets/icons/${label.toLowerCase()}.svg`, import.meta.url);

      return { label, handle: String(handle), svg: await readFile(icon, 'utf8') };
    })
  );
}

const drawingFile = new URL('../src/assets/images/site.png', import.meta.url);

// The drawing through inlinedDrawing(), as toImageSite() makes it, from the
// file as Vite inlines it.
async function drawing(): Promise<ImageSite['drawing']> {
  const png = await readFile(drawingFile);

  return inlinedDrawing(`data:image/png;base64,${png.toString('base64')}`);
}

// The src of every <img> in an element tree.
function images(element: OgElement): string[] {
  const own = element.type === 'img' ? [String(element.props.src)] : [];
  const children = [element.props.children ?? []].flat().filter((child) => {
    return typeof child === 'object';
  });

  return [...own, ...children.flatMap(images)];
}

test('the drawing size read from the inlined PNG is the file size', async () => {
  const { width, height } = await sharp(await readFile(drawingFile)).metadata();
  const value = await drawing();
  assert.deepEqual([value.width, value.height], [width, height]);
});

// Platforms crop the edges of a link preview, so nothing may be drawn in the
// 10% right margin (x 1080 on) or in the bottom margin above the accent bar
// (y 560 to 616). A handle does not wrap, so one too long for its column runs
// into the right margin, and a channel too many pushes the bottom row down.
// The accent bar under them (y 616 on) is accentBar() from og-image.ts, which
// the post and project images draw too.
test('the name, the role and every channel stay inside the safe area', async () => {
  const png = await renderOgImage(siteImage(await site()));
  const { bg, accent } = IMAGE_PALETTES.light;
  const regions = [
    { name: 'right margin', hex: bg, region: { left: 1080, top: 0, width: 120, height: 616 } },
    { name: 'bottom margin', hex: bg, region: { left: 0, top: 560, width: 1200, height: 56 } },
    { name: 'accent bar', hex: accent, region: { left: 0, top: 616, width: 1200, height: 14 } },
  ];
  for (const { name, hex, region } of regions) {
    const color = Buffer.from(hex.slice(1), 'hex');
    // Raw pixels: sharp's stats() reads the whole input and ignores extract().
    const { data, info } = await sharp(png)
      .extract(region)
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels) {
      assert.ok(data.subarray(i, i + 3).equals(color), `another colour in the ${name}`);
    }
  }
});

// An <img> has no currentColor, so each icon file is painted before it goes
// in: unpainted, an icon draws near-black instead of the tertiary text colour.
test('every channel draws its icon, in the tertiary text colour', async () => {
  const value = await site();
  const icons = images(siteImage(value)).filter((src) => {
    return src.startsWith('data:image/svg+xml;base64,');
  });
  assert.equal(icons.length, value.contacts.length, 'a channel without its icon');
  for (const src of icons) {
    const svg = Buffer.from(src.slice(src.indexOf(',') + 1), 'base64').toString('utf8');
    assert.doesNotMatch(svg, /currentColor/);
    assert.ok(svg.includes(IMAGE_PALETTES.light['text-tertiary']), 'not the tertiary colour');
  }
  // The icon files have no xmlns, and Satori draws them all the same. Should
  // an update stop drawing them, the image is the one it is with blank icons.
  const blank = value.contacts.map((contact) => {
    return { ...contact, svg: '<svg viewBox="0 0 24 24"></svg>' };
  });
  const [drawn, empty] = await Promise.all([
    renderOgImage(siteImage(value)),
    renderOgImage(siteImage({ ...value, contacts: blank })),
  ]);
  assert.ok(!drawn.equals(empty), 'the icons draw nothing');
});

// Link previews cache an image by its URL, so a changed channel needs a new
// URL, and an unchanged image keeps its old one.
test('the image URL changes with the channels', async () => {
  const value = await site();
  const src = await siteImageSrc(value);
  assert.match(src, /^\/site\.png\?v=[0-9a-f]{8}$/);
  assert.equal(await siteImageSrc({ ...value }), src);
  const [first, ...rest] = value.contacts;
  const changed = [{ ...first, handle: `${first.handle}2` }, ...rest];
  assert.notEqual(await siteImageSrc({ ...value, contacts: changed }), src);
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
