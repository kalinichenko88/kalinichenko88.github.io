import assert from 'node:assert/strict';
import { glob, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (file: string) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

// Running text on the open field sits on .reading-veil (DESIGN.md > Interaction).
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
    assert.match(await read(file), /\breading-veil\b/, `${file} has no reading veil`);
  }
});

// The veil reaches 72px past its text, so on a narrow window it passes the
// viewport; without the clip the page scrolls sideways.
test('every reading veil sits in a block that clips its overflow', async () => {
  for await (const file of glob('src/**/*.astro')) {
    const source = await read(file);
    if (/\breading-veil\b/.test(source)) {
      assert.match(source, /\boverflow-x-clip\b/, `${file} does not clip the veil`);
    }
  }
});
