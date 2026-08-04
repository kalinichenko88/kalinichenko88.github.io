import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const files = [
  'src/pages/about.astro',
  'src/pages/blog/index.astro',
  'src/pages/blog/[...id].astro',
  'src/pages/tags/index.astro',
  'src/pages/tags/[tag].astro',
  'src/pages/404.astro',
];

test('every content page opts major blocks into motion', async () => {
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /data-reveal=/, `${file} has no reveal annotation`);
  }
});

test('article prose is not annotated for reveal', async () => {
  const article = await readFile(
    new URL('../src/pages/blog/[...id].astro', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(article, /class="prose[^>]+data-reveal/);
  assert.doesNotMatch(article, /data-reveal[^>]+class="prose/);
});
