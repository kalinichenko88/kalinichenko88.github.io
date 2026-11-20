import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { DARK_THEME } from '../../src/config/themes.ts';
import { visit, widgetUrl } from './comments-page.ts';

// The theme switch on the list page finds no comments. A throw in its listener
// would fail this file as an uncaught exception.
test('a direct load and each later post of a visit run client.js once', () => {
  const { page, navigateTo, switchTheme } = visit();

  assert.deepEqual(page.loads, ['light']);
  navigateTo('list');
  switchTheme(DARK_THEME);
  navigateTo('post');

  assert.deepEqual(page.loads, ['transparent_dark']);
});

// The new post gets astro:page-load after the swap, and again on the first page's window load.
test('a navigation before the window load runs client.js once on the new post', () => {
  const { page, navigateTo, finishWindowLoad } = visit({ windowLoaded: false });

  assert.deepEqual(page.loads, ['light'], 'the first post does not wait for the window load');
  navigateTo('post');
  finishWindowLoad();

  assert.deepEqual(page.loads, ['light']);
});

test('a theme switch before client.js runs gives it the new theme, with no second client.js', () => {
  const { page, switchTheme } = visit();
  switchTheme(DARK_THEME);

  assert.deepEqual(page.loads, ['light']);
  assert.equal(page.scripts[0].attributes['data-theme'], 'transparent_dark');
});

test('a theme switch changes the theme of a loaded frame without loading it again', () => {
  const { page, runClientJs, switchTheme } = visit();
  runClientJs(true);
  switchTheme(DARK_THEME);

  assert.deepEqual(page.loads, ['light']);
  assert.deepEqual(page.messages, [
    [{ giscus: { setConfig: { theme: 'transparent_dark' } } }, 'https://giscus.app'],
  ]);
  assert.equal(page.frame?.src, widgetUrl('light'));
});

// A lazy frame below the fold loads only when the reader scrolls to it, from its
// URL. A message before that is lost.
test('a theme switch before the frame loads puts the new theme in its URL', () => {
  const { page, runClientJs, switchTheme } = visit();
  runClientJs(false);
  switchTheme(DARK_THEME);

  assert.deepEqual(page.loads, ['light']);
  assert.deepEqual(page.messages, []);
  assert.equal(page.frame?.src, widgetUrl('transparent_dark'));
});

// switchTheme() in the fake page stands in for applyTheme(): the loader reads the
// new data-theme when theme-changed reaches window.
test('the theme switcher sends theme-changed on window after it sets data-theme', async () => {
  const switcher = await readFile(
    new URL('../../src/components/header/ThemeSwitcher.astro', import.meta.url),
    'utf8'
  );
  const setsTheme = switcher.indexOf("document.documentElement.setAttribute('data-theme'");
  const sendsEvent = switcher.indexOf("window.dispatchEvent(new Event('theme-changed'))");

  assert.ok(setsTheme !== -1 && sendsEvent > setsTheme);
});
