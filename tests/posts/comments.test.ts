import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import { DARK_THEME, LIGHT_THEME } from '../../src/config/themes.ts';

// The giscus loader is an is:inline script, so the test runs its text in a fake
// page that holds only what the script touches. client.js does not run: a test
// puts the frame in the page itself, as client.js would.
const source = await readFile(
  new URL('../../src/components/blog/Comments.astro', import.meta.url),
  'utf8'
);
const loader = source.match(/<script is:inline[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '';

const CONFIG = JSON.stringify({
  themes: { [LIGHT_THEME]: 'light', [DARK_THEME]: 'transparent_dark' },
});

type Script = { attributes: Record<string, string>; dataset: Record<string, string> };

// A visit that opens on a post, as Astro's ClientRouter (astro/dist/transitions/router.js) runs it.
function visit() {
  const page = {
    isPost: true,
    theme: LIGHT_THEME,
    frame: undefined as { loaded: boolean } | undefined,
    scripts: [] as Script[],
    // The data-theme of each run of client.js.
    loads: [] as string[],
    messages: [] as [unknown, string][],
  };
  const container = {
    set innerHTML(_html: string) {
      page.frame = undefined;
      page.scripts = [];
    },
    appendChild(script: Script) {
      page.scripts.push(script);
      page.loads.push(script.attributes['data-theme']);
    },
  };
  const document = Object.assign(new EventTarget(), {
    currentScript: { dataset: { giscusConfig: CONFIG } },
    documentElement: {
      getAttribute: () => {
        return page.theme;
      },
    },
    createElement: () => {
      const attributes: Record<string, string> = {};

      return {
        attributes,
        dataset: {},
        setAttribute: (name: string, value: string) => {
          attributes[name] = value;
        },
      };
    },
    querySelector: (selector: string) => {
      if (selector === '.giscus') {
        return page.isPost ? container : null;
      }

      return selector === 'iframe.giscus-frame' ? frameElement() : null;
    },
  });
  const frameElement = () => {
    const frame = page.frame;

    return (
      frame && {
        classList: {
          contains: (name: string) => {
            return name === 'giscus-frame--loading' && !frame.loaded;
          },
        },
        contentWindow: {
          // postMessage hands the frame a structured clone, in this realm.
          postMessage: (data: unknown, origin: string) => {
            page.messages.push([structuredClone(data), origin]);
          },
        },
      }
    );
  };
  const window = new EventTarget();
  const context = vm.createContext({ window, document });
  // Astro runs an inline script once per visit: it keeps the text of each one it ran.
  let loaderRan = false;
  const runLoader = () => {
    if (page.isPost && !loaderRan) {
      loaderRan = true;
      vm.runInContext(loader, context);
    }
  };

  runLoader();
  document.dispatchEvent(new Event('astro:page-load'));

  return {
    page,
    // A client-router navigation: Astro swaps the page and fires astro:after-swap.
    // It then runs each script in the page with no data-astro-exec, in page order:
    // a client.js in the comments box runs again, and the loader comes after it.
    navigateTo: (next: 'post' | 'list') => {
      page.isPost = next === 'post';
      page.frame = undefined;
      page.scripts = [];
      page.loads = [];
      document.dispatchEvent(new Event('astro:after-swap'));
      for (const script of page.scripts) {
        if (!('astroExec' in script.dataset)) {
          script.dataset.astroExec = '';
          page.loads.push(script.attributes['data-theme']);
        }
      }
      runLoader();
      document.dispatchEvent(new Event('astro:page-load'));
    },
    switchTheme: (theme: string) => {
      page.theme = theme;
      window.dispatchEvent(new Event('theme-changed'));
    },
  };
}

test('a direct load of a post runs client.js once', () => {
  const { page } = visit();

  assert.deepEqual(page.loads, ['light']);
});

test('each later post of a visit runs client.js once', () => {
  const { page, navigateTo } = visit();
  navigateTo('list');
  navigateTo('post');

  assert.deepEqual(page.loads, ['light']);
});

test('a theme switch changes the theme of a loaded frame without loading it again', () => {
  const { page, switchTheme } = visit();
  page.frame = { loaded: true };
  switchTheme(DARK_THEME);

  assert.deepEqual(page.loads, ['light']);
  assert.deepEqual(page.messages, [
    [{ giscus: { setConfig: { theme: 'transparent_dark' } } }, 'https://giscus.app'],
  ]);
  assert.ok(page.frame, 'the loaded frame stays in the page');
});

// A lazy frame below the fold loads only when the reader scrolls to it, from its
// URL, which holds the theme of its load. A message before that is lost.
test('a theme switch before the frame loads loads it again in the new theme', () => {
  const { page, switchTheme } = visit();
  page.frame = { loaded: false };
  switchTheme(DARK_THEME);

  assert.deepEqual(page.loads, ['light', 'transparent_dark']);
  assert.deepEqual(page.messages, []);
});
