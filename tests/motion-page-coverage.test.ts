import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const files = [
  'src/pages/about.astro',
  'src/pages/projects/index.astro',
  'src/pages/projects/[slug].astro',
  'src/pages/blog/index.astro',
  'src/pages/blog/[...id].astro',
  'src/pages/tags/index.astro',
  'src/pages/tags/[tag].astro',
  'src/pages/contact.astro',
  'src/pages/404.astro',
];

test('every content page opts major blocks into motion', async () => {
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /data-reveal=/, `${file} has no reveal annotation`);
  }
});

// WebKit draws a composited child of a multi-column box in the first column
// only: on /blog in Safari the second and third columns stayed blank (#100).
// A card is composited for as long as its reveal runs, so the list reveals as
// one block and no card in it is a reveal target.
test('a post masonry reveals as one block, never card by card', async () => {
  const card = await read('src/components/PostCard.astro');
  assert.doesNotMatch(card, /data-reveal/, 'a card in the masonry reveals on its own');
  const src = new URL('../src/', import.meta.url);
  for (const file of await readdir(src, { recursive: true })) {
    if (!file.endsWith('.astro')) {
      continue;
    }
    const source = await read(`src/${file}`);
    // A columns box without .masonry misses the WebKit rules below.
    assert.doesNotMatch(source, /\bcolumns-\d/, `${file} hand-rolls a masonry`);
    for (const [list] of source.matchAll(/<div[^>]*\bclass="[^"]*\bmasonry\b[^"]*"[^>]*>/g)) {
      assert.match(list, /data-reveal=/, `${file}: the masonry is not one reveal block`);
    }
  }
});

test('the post masonry keeps WebKit painting every column, flush at the top', async () => {
  const css = (await read('src/styles/global.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  // The fixed pixel field under the cards makes WebKit composite each card it
  // overlaps, unless the list is a stacking context of its own.
  assert.ok(/\.masonry {[^}]*isolation: isolate/.test(css), '.masonry is not isolated');
  // WebKit lets a block's margin run across a column break, so a column
  // started 24px low. A line moves whole: each card is one, and Blink must
  // not hold two of them together at a break.
  assert.ok(/\.masonry > \* {[^}]*display: inline-block/.test(css), 'a card is not a line');
  assert.ok(/\.masonry {[^}]*orphans: 1/.test(css), 'Blink keeps cards together');
  assert.ok(/\.masonry {[^}]*widows: 1/.test(css), 'Blink keeps cards together');
});

test('rendered prose is not annotated for reveal', async () => {
  for (const file of ['src/pages/blog/[...id].astro', 'src/pages/projects/[slug].astro']) {
    const source = await read(file);
    assert.doesNotMatch(source, /class="prose[^>]+data-reveal/, file);
    assert.doesNotMatch(source, /data-reveal[^>]+class="prose/, file);
  }
});

function read(file: string) {
  return readFile(new URL(`../${file}`, import.meta.url), 'utf8');
}
