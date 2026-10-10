import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';

// Covers come from the illustrate-post skill, whose prepare.mjs writes every
// master transparent and at 1536x1024. This catches a file that skipped it,
// such as a hand download from ChatGPT, and a re-run that added a second line.
const postsDir = new URL('../content/posts/', import.meta.url);

async function coverLines() {
  const posts: { file: string; lines: string[] }[] = [];
  for (const file of await readdir(postsDir)) {
    const source = await readFile(new URL(file, postsDir), 'utf8');
    posts.push({ file, lines: source.match(/^cover: .+$/gm) ?? [] });
  }
  return posts;
}

test('a post declares at most one cover', async () => {
  for (const { file, lines } of await coverLines()) {
    assert.ok(lines.length <= 1, `${file} has ${lines.length} cover lines`);
  }
});

test('every cover is a transparent 1536x1024 master', async () => {
  for (const { file, lines } of await coverLines()) {
    if (lines.length === 0) continue;
    const relative = lines[0].slice('cover: '.length).trim();
    const path = fileURLToPath(new URL(relative, new URL(file, postsDir)));
    const { width, height } = await sharp(path).metadata();
    assert.deepEqual([width, height], [1536, 1024], `${file}: cover is ${width}x${height}`);
    assert.equal((await sharp(path).stats()).isOpaque, false, `${file}: cover is opaque`);
  }
});
