import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Running text on the open field sits on .reading-veil (DESIGN.md > Interaction).
// This list is the one record of where it is used; add a new surface here.
const surfaces = [
  'src/pages/blog/[...id].astro',
  'src/pages/blog/index.astro',
  'src/pages/about.astro',
  'src/pages/404.astro',
  'src/components/home/HeroSection.astro',
  'src/components/home/ContactSection.astro',
];

test('running text on the open field sits on the reading veil', async () => {
  for (const file of surfaces) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(source, /\breading-veil\b/, `${file} has no reading veil`);
  }
});

// The veil reaches 72px past its text, so on a narrow window it passes the
// viewport; without the clip the page scrolls sideways.
test('the page clips what the veil pushes past the viewport', async () => {
  const layout = await readFile(new URL('../src/components/Layout.astro', import.meta.url), 'utf8');
  assert.match(layout, /<main class:list=\{\['[^']*\boverflow-x-clip\b/);
});
