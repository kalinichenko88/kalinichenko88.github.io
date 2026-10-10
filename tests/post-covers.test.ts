import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';

// Covers come from the illustrate-post skill, whose prepare.mjs trims every
// cover to its drawing, palette-compresses it and writes its social image.
// This catches a file that skipped it, such as a hand download from ChatGPT
// (truecolor, no social image), and a re-run that added a second line.
const postsDir = new URL('../content/posts/', import.meta.url);

async function coverLines() {
  const posts: { file: string; lines: string[] }[] = [];
  for (const file of await readdir(postsDir)) {
    const source = await readFile(new URL(file, postsDir), 'utf8');
    posts.push({ file, lines: source.match(/^cover: .+$/gm) ?? [] });
  }
  return posts;
}

test('every post declares exactly one cover', async () => {
  for (const { file, lines } of await coverLines()) {
    assert.equal(lines.length, 1, `${file} has ${lines.length} cover lines; run illustrate-post`);
  }
});

test('every cover went through prepare.mjs and has its social image', async () => {
  for (const { file, lines } of await coverLines()) {
    if (lines.length === 0) continue;
    const id = file.replace(/\.mdx?$/, '');
    const relative = lines[0].slice('cover: '.length).trim();
    // The post page finds the social image by this name.
    assert.equal(relative, `../../src/assets/images/covers/${id}.png`, `${file}: cover path`);
    const path = fileURLToPath(new URL(relative, new URL(file, postsDir)));

    const meta = await sharp(path).metadata();
    assert.ok(meta.isPalette, `${file}: cover is not palette-compressed; run prepare.mjs`);
    assert.equal((await sharp(path).stats()).isOpaque, false, `${file}: cover is opaque`);

    const social = await sharp(path.replace(/\.png$/, '.og.jpg')).metadata();
    assert.deepEqual(
      [social.format, social.width, social.height],
      ['jpeg', 1200, 630],
      `${file}: social image`
    );
  }
});

// /blog, /tags and the homepage Writing row all render covers through PostCard.
const surfaces = ['src/components/PostCard.astro', 'src/pages/blog/[...id].astro'];

test('every cover surface renders it without a build-time crop', async () => {
  for (const file of surfaces) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const tags = source.match(/<Image\b[^>]*\.data\.cover\b[^>]*>/g) ?? [];
    assert.ok(tags.length > 0, `${file} does not render the cover`);
    for (const tag of tags) {
      // With both set and no fit, sharp crops to cover before CSS applies.
      assert.doesNotMatch(tag, /\sheight=/, `${file}: a cover <Image> must not set height`);
      assert.match(tag, /\salt=""/, `${file}: covers are decorative, alt=""`);
      assert.match(tag, /\swidths=/, `${file}: a cover <Image> needs widths and sizes`);
    }
  }
});
