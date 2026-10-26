import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

import { IMAGE_PALETTES, renderOgImage } from '../src/lib/og-image.ts';
import { postImage, postImageSrc, type ImagePost } from '../src/lib/post-image.ts';

// Every post with a cover gets a 1200x630 image, rendered at build time by
// src/pages/blog/[id].png.ts: its og:image and its JSON-LD image.
const postsDir = new URL('../content/posts/', import.meta.url);
const coversDir = new URL('../src/assets/images/covers/', import.meta.url);

async function posts() {
  const found: (ImagePost & { file: string; id: string })[] = [];
  for (const file of await readdir(postsDir)) {
    const source = await readFile(new URL(file, postsDir), 'utf8');
    const field = (name: string) => {
      return source.match(new RegExp(`^${name}: *(['"]?)(.*)\\1$`, 'm'))?.[2] ?? '';
    };
    const id = file.replace(/\.mdx?$/, '');
    const body = source.split(/^---$/m).slice(2).join('---');
    found.push({
      file,
      id,
      title: field('title'),
      description: field('description'),
      pubDate: new Date(field('pubDate')),
      minutesRead: Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 200)),
      cover: await cover(id),
    });
  }
  return found;
}

// The cover as the page passes it: a data: URL, with the file's own size.
async function cover(id: string): Promise<ImagePost['cover']> {
  const png = await readFile(new URL(`${id}.png`, coversDir));
  const { width = 0, height = 0 } = await sharp(png).metadata();

  return { src: `data:image/png;base64,${png.toString('base64')}`, width, height };
}

test('every post renders a 1200x630 palette PNG', async () => {
  for (const post of await posts()) {
    assert.ok(post.title && post.description, `${post.file}: frontmatter`);
    const png = await renderOgImage(postImage(post));
    const { format, width, height, isPalette } = await sharp(png).metadata();
    assert.deepEqual([format, width, height], ['png', 1200, 630], post.file);
    // The covers are 256-colour drawings, so the palette loses nothing here.
    assert.ok(isPalette, `${post.file}: not a palette PNG`);
  }
});

// Platforms crop the edges of a link preview, so nothing may be drawn in the
// 10% right margin (x 1080 on) or in the bottom margin above the accent bar
// (y 560 to 616), where text that does not fit would spill. The case: a title
// far longer than any so far and a description at the 125 limit, next to the
// widest and the tallest cover. Satori always fills the canvas, so only the
// pixels can tell.
test('the longest text and every cover shape stay inside the safe area', async () => {
  const longest = {
    title: 'Automating monorepo dependency updates and tool upgrades with Claude Code commands',
    description:
      'A Neovim setup that uses Copilot Chat to generate commit messages with the right format, branch names, repo rules, and tests.',
    pubDate: new Date('2026-09-30'),
    minutesRead: 12,
  };
  assert.equal(longest.description.length, 125);
  const bg = Buffer.from(IMAGE_PALETTES.light.bg.slice(1), 'hex');
  const margins = {
    right: { left: 1080, top: 0, width: 120, height: 616 },
    bottom: { left: 0, top: 560, width: 1200, height: 56 },
  };
  for (const id of ['budget-planner-obsidian-community-plugins', 'hello-world']) {
    const png = await renderOgImage(postImage({ ...longest, cover: await cover(id) }));
    for (const [name, region] of Object.entries(margins)) {
      // Raw pixels: sharp's stats() reads the whole input and ignores extract().
      const { data, info } = await sharp(png)
        .extract(region)
        .raw()
        .toBuffer({ resolveWithObject: true });
      for (let i = 0; i < data.length; i += info.channels) {
        assert.ok(data.subarray(i, i + 3).equals(bg), `${id}: drawn in the ${name} margin`);
      }
    }
  }
});

// The fonts carry the latin subset only, and Satori draws a glyph outside it
// as nothing, with no error. So the text the image draws must stay inside it.
test('every post title and description is in the image font subset', async () => {
  for (const { file, title, description } of await posts()) {
    assert.match(
      `${title}${description}`,
      /^[\u0020-\u007e\u00a0-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2026]*$/,
      file
    );
  }
});

// Link previews cache an image by its URL, so a new title or description
// needs a new URL, and an unchanged post keeps its old one.
test('the image URL changes with the text', async () => {
  const [post] = (await posts()).sort((a, b) => a.file.localeCompare(b.file));
  const src = await postImageSrc(post.id, post);
  assert.match(src, /^\/blog\/[\w-]+\.png\?v=[0-9a-f]{8}$/);
  assert.equal(await postImageSrc(post.id, { ...post }), src);
  assert.notEqual(await postImageSrc(post.id, { ...post, title: `${post.title}!` }), src);
  const description = `${post.description.slice(0, -1)}!`;
  assert.notEqual(await postImageSrc(post.id, { ...post, description }), src);
});

test('a post page passes its rendered image to og:image and JSON-LD', async () => {
  const page = await readFile(new URL('../src/pages/blog/[...id].astro', import.meta.url), 'utf8');
  assert.match(page, /postImageSrc\(post\.id, imagePost\)/);
  assert.match(page, /image=\{socialImage\}/);
  assert.match(page, /image: socialImage\.src/);
  assert.doesNotMatch(page, /\.og\.jpg/, 'the page still reads a social image file');
});
