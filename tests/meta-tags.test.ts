import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
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

test('a missing or doubled tag fails', async () => {
  const page = head
    .replace(/<meta property="og:image:alt"[^>]*>/, '')
    .replace(
      '<meta name="twitter:card"',
      '<meta name="twitter:card" content="x"><meta name="twitter:card"'
    );

  // The first twitter:card is the one a preview reads.
  assert.deepEqual(await check({ [POST]: page }), [
    `/${POST}/: og:image:alt is missing`,
    `/${POST}/: twitter:card appears 2 times`,
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

test('an og:image file that is not 1200x630 fails', async () => {
  assert.deepEqual(await check({ [POST]: head }, { width: 1200, height: 600 }), [
    `/${POST}/: og:image is 1200x600, not 1200x630`,
  ]);
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

/** Writes each page and its 1200x630 og:image to a temporary build. */
async function check(
  pages: Record<string, string>,
  image = { width: 1200, height: 630 }
): Promise<string[]> {
  const dir = await mkdtemp(join(tmpdir(), 'meta-tags-'));
  const png = await sharp({
    create: { ...image, channels: 3, background: '#f4f2ee' },
  })
    .png()
    .toBuffer();

  for (const [path, html] of Object.entries(pages)) {
    await mkdir(join(dir, path), { recursive: true });
    await writeFile(join(dir, path, 'index.html'), html);
  }
  await writeFile(join(dir, `${POST}.png`), png);

  return checkMetaTags(pathToFileURL(`${dir}/`), SITE);
}
