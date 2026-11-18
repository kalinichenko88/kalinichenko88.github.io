import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

import { isActive } from '../src/config/navigation.ts';

// Paths as the static build hands them to the header: with a trailing slash.
test('a nav item is active on its page and the pages under it', () => {
  assert.ok(isActive('/projects', '/projects/'));
  assert.ok(isActive('/blog', '/blog/'));
  assert.ok(isActive('/blog', '/blog/neovim-commit-workflow/'));
  assert.ok(isActive('/', '/'));
});

test('a nav item is not active elsewhere', () => {
  assert.ok(!isActive('/', '/blog/'));
  assert.ok(!isActive('/contact', '/'));
  assert.ok(!isActive('/blog', '/blogroll/'));
});

// ARIA forbids a name on a plain div or span, so screen readers drop the label
// and announce no landmark: a labelled block needs an element with a role, as <nav>.
test('no plain div or span carries an aria-label', async () => {
  const src = new URL('../src/', import.meta.url);
  for (const file of await readdir(src, { recursive: true })) {
    if (!file.endsWith('.astro')) {
      continue;
    }
    const source = await readFile(new URL(file, src), 'utf8');
    for (const [tag] of source.matchAll(/<(?:div|span)\b[^>]*>/g)) {
      if (!tag.includes('role=')) {
        assert.doesNotMatch(tag, /aria-label=/, `${file}: ${tag}`);
      }
    }
  }
});
