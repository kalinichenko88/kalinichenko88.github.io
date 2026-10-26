import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';

import { SITE_TITLE } from '../src/consts.ts';
import { checkMetaTags } from '../src/lib/check-meta-tags.ts';

// astro.config.js runs checkMetaTags() on every build, so the real pages pass
// through it there. These tests show that it fails a page for each rule.

const SITE = 'https://kalinichenko.dev';
const POST = 'blog/claude-code-commit-attribution';
// The <head> of that post as the build wrote it.
const head = await readFile(new URL('./fixtures/post-head.html', import.meta.url), 'utf8');

test('the recorded post page passes', async () => {
  assert.deepEqual(await check({ [POST]: head }), []);
});

// CI builds with the --site of GitHub Pages: the github.io address when the
// custom domain is gone.
test('the same page under another site passes', async () => {
  const site = 'https://kalinichenko88.github.io/';
  const page = head.replaceAll(`${SITE}/`, site);

  assert.deepEqual(await check({ [POST]: page }, { site }), []);
});

// What the post page passed as its title before #84.
test('a post title with SITE_TITLE after it fails', async () => {
  const branded = `Disabling commit and PR attribution in Claude Code - ${SITE_TITLE}`;
  const page = head
    .replace(/<title>[^<]*/, `<title>${branded}`)
    .replace(/(og:title" content=")[^"]*/, `$1${branded}`);

  assert.deepEqual(await check({ [POST]: page }), [
    `/${POST}/: <title> is 97 characters, 60 at most`,
    `/${POST}/: og:title is 97 characters, 60 at most`,
    `/${POST}/: og:title names the site, which og:site_name does`,
  ]);
});

test('a post about the site may name it in its title', async () => {
  const topic = 'Rebuilding kalinichenko.dev with Astro 7';
  const page = head
    .replace(/<title>[^<]*/, `<title>${topic} - Ivan Kalinichenko`)
    .replace(/(og:title" content=")[^"]*/, `$1${topic}`);

  assert.deepEqual(await check({ [POST]: page }), []);
});

// A second copy counts in any attribute order.
test('a missing or doubled tag fails', async () => {
  const page = head
    .replace(/<meta property="og:image:alt"[^>]*>/, '')
    .replace(
      '<meta name="twitter:card"',
      '<meta content="x" name="twitter:card"><meta name="twitter:card"'
    )
    .replace(
      '<meta property="article:author"',
      '<meta property="article:published_time" content="2026-09-01"><meta property="article:author"'
    );

  // The first twitter:card is the one a preview reads.
  assert.deepEqual(await check({ [POST]: page }), [
    `/${POST}/: og:image:alt is missing`,
    `/${POST}/: twitter:card appears 2 times`,
    `/${POST}/: an article needs one valid article:published_time`,
    `/${POST}/: twitter:card is not summary_large_image`,
  ]);
});

// The build writes a quote as &quot;, which a preview shows as one character.
test('a description over 125 characters fails, an entity counted as one', async () => {
  const long = `&quot;${'a'.repeat(124)}&quot;`;
  const page = head.replace(
    /(name="description" content=")[^"]*([\s\S]*og:description" content=")[^"]*/,
    `$1${long}$2${long}`
  );

  assert.deepEqual(await check({ [POST]: page }), [
    `/${POST}/: description is 126 characters, 125 at most`,
  ]);
});

test('an og:image file that is not 1200x630, or not an image, fails', async () => {
  const src = head.match(/og:image" content="([^"]*)/)?.[1];

  assert.deepEqual(await check({ [POST]: head }, { image: await png(1200, 600) }), [
    `/${POST}/: og:image is 1200x600, not 1200x630`,
  ]);
  assert.deepEqual(await check({ [POST]: head }, { image: Buffer.from('not a PNG') }), [
    `/${POST}/: og:image ${src} is not an image`,
  ]);
});

test('an SVG <title> in the body is not a second <title>', async () => {
  const page = `${head}<body><svg><title>Arrow</title></svg></body>`;

  assert.deepEqual(await check({ [POST]: page }), []);
});

test('the 404 page is not checked', async () => {
  assert.deepEqual(await check({ [POST]: head, '404': '<head></head>' }), []);
});

test('a build with no pages to check fails', async () => {
  assert.deepEqual(await check({}), ['the build has no pages to check']);
});

test('a repeated title or description, or a canonical URL elsewhere, fails', async () => {
  // Another address, the same image.
  const copy = head.replaceAll(`${SITE}/${POST}/`, `${SITE}/blog/copy/`);
  // A canonical URL that is not the page's own address fails too.
  const wrongUrl = head.replace(/(rel="canonical" href=")[^"]*/, `$1${SITE}/`);

  assert.deepEqual(await check({ [POST]: head, 'blog/copy': copy }), [
    '/blog/copy/: same <title> as /blog/claude-code-commit-attribution/',
    '/blog/copy/: same description as /blog/claude-code-commit-attribution/',
  ]);
  assert.deepEqual(await check({ [POST]: wrongUrl }), [
    `/${POST}/: canonical is ${SITE}/, not the page's address ${SITE}/${POST}/`,
  ]);
});

type Build = {
  /** The post's og:image file; a 1200x630 PNG by default. */
  image?: Buffer;
  site?: string;
};

/**
 * Writes each page, by its path, and the post's og:image to a temporary
 * build, and checks it. Each page is its own route, as Astro's `assets` lists
 * it; the path "404" is the 404 route.
 */
async function check(
  pages: Record<string, string>,
  { image, site = `${SITE}/` }: Build = {}
): Promise<string[]> {
  const dir = await mkdtemp(join(tmpdir(), 'meta-tags-'));
  const assets = new Map<string, URL[]>();

  try {
    for (const [path, html] of Object.entries(pages)) {
      const file = path === '404' ? join(dir, '404.html') : join(dir, path, 'index.html');
      await mkdir(join(file, '..'), { recursive: true });
      await writeFile(file, html);
      assets.set(`/${path}`, [pathToFileURL(file)]);
    }
    await mkdir(join(dir, POST, '..'), { recursive: true });
    await writeFile(join(dir, `${POST}.png`), image ?? (await png(1200, 630)));

    return await checkMetaTags(pathToFileURL(`${dir}/`), site, assets);
  } finally {
    await rm(dir, { recursive: true });
  }
}

function png(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#f4f2ee' } })
    .png()
    .toBuffer();
}
