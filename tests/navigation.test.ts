import assert from 'node:assert/strict';
import test from 'node:test';

import { isActive } from '../src/config/navigation.ts';

// Paths as the static build hands them to Header.astro: with a trailing slash.
test('a nav item is active on its page and the pages under it', () => {
  assert.ok(isActive('/projects', '/projects/'));
  assert.ok(isActive('/blog', '/blog/'));
  assert.ok(isActive('/blog', '/blog/neovim-commit-workflow/'));
  assert.ok(isActive('/', '/'));
});

test('a nav item is not active elsewhere', () => {
  assert.ok(!isActive('/', '/blog/'));
  assert.ok(!isActive('/#contact', '/'));
  assert.ok(!isActive('/blog', '/blogroll/'));
});
