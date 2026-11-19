import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

import { isActive } from '../../src/config/navigation.ts';

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

async function* astroSources() {
  const src = new URL('../../src/', import.meta.url);
  for (const file of await readdir(src, { recursive: true })) {
    if (file.endsWith('.astro')) {
      yield [file, await readFile(new URL(file, src), 'utf8')] as const;
    }
  }
}

// ARIA forbids a name on a plain div or span, so screen readers drop the label
// and announce no landmark: a labelled block needs an element with a role, as <nav>.
test('no plain div or span carries an aria-label', async () => {
  for await (const [file, source] of astroSources()) {
    for (const [tag] of source.matchAll(/<(?:div|span)\b[^>]*>/g)) {
      if (!tag.includes('role=')) {
        assert.doesNotMatch(tag, /aria-label=/, `${file}: ${tag}`);
      }
    }
  }
});

// A screen reader announces an ARIA menu as one that the arrow keys move through.
// No script here does that, so a popup is a disclosure: a button with
// aria-expanded over plain buttons that Tab reaches (#110).
test('no element claims the ARIA menu pattern', async () => {
  for await (const [file, source] of astroSources()) {
    assert.doesNotMatch(source, /role="menu|aria-haspopup="(?:true|menu)"/, file);
  }
});
