import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

test('rendered prose is not annotated for reveal', async () => {
  for (const file of ['src/pages/blog/[...id].astro', 'src/pages/projects/[slug].astro']) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /class="prose[^>]+data-reveal/, file);
    assert.doesNotMatch(source, /data-reveal[^>]+class="prose/, file);
  }
});
