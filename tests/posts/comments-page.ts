import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

import { DARK_THEME, LIGHT_THEME } from '../../src/config/themes.ts';

// The giscus loader is an is:inline script, so the tests run its text in a fake
// page that holds only what the script touches. client.js does not run: a test
// calls runClientJs() to do in the page what client.js does.
const source = await readFile(
  new URL('../../src/components/blog/Comments.astro', import.meta.url),
  'utf8'
);
const loader = source.match(/<script is:inline[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '';
assert.ok(loader, 'Comments.astro holds the giscus loader as its is:inline script');

const giscusConfig = JSON.stringify({
  themes: { [LIGHT_THEME]: 'light', [DARK_THEME]: 'transparent_dark' },
});

type Script = { attributes: Record<string, string>; dataset: Record<string, string> };

// A visit that opens on a post, as Astro's ClientRouter (astro/dist/transitions/router.js)
// runs it. The first astro:page-load comes on the window load, which waits for
// every image: with windowLoaded false, the test fires it with finishWindowLoad().
export function visit({ windowLoaded = true } = {}) {
  const page = {
    isPost: true,
    theme: LIGHT_THEME,
    frame: undefined as { src: string } | undefined,
    // The client.js scripts in the comments box that have not run yet.
    scripts: [] as Script[],
    // The data-theme of each client.js script, when it is added and when Astro runs it again.
    loads: [] as string[],
    messages: [] as [unknown, string][],
  };
  const container = {
    get childElementCount() {
      return page.scripts.length + (page.frame ? 1 : 0);
    },
    appendChild(script: Script) {
      page.scripts.push(script);
      page.loads.push(script.attributes['data-theme']);
    },
  };
  const document = Object.assign(new EventTarget(), {
    readyState: 'loading',
    currentScript: { dataset: { giscusConfig } },
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
      const elements: Record<string, unknown> = {
        '.giscus': container,
        '.giscus > script': page.scripts.at(-1),
        'iframe.giscus-frame': page.frame,
      };

      return (page.isPost && elements[selector]) || null;
    },
  });
  const window = new EventTarget();
  const context = vm.createContext({ window, document, URL });
  // Astro runs an inline script once per visit: it keeps the text of each one it ran.
  let loaderRan = false;
  const runLoader = () => {
    if (page.isPost && !loaderRan) {
      loaderRan = true;
      vm.runInContext(loader, context);
    }
  };
  const finishWindowLoad = () => {
    document.readyState = 'complete';
    document.dispatchEvent(new Event('astro:page-load'));
  };

  runLoader();
  document.readyState = 'interactive';
  if (windowLoaded) {
    finishWindowLoad();
  }

  return {
    page,
    finishWindowLoad,
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
    // client.js replaces its script with a frame whose URL holds the script's theme.
    runClientJs: (frameLoaded: boolean) => {
      const frame = {
        src: widgetUrl(page.scripts.at(-1)?.attributes['data-theme'] ?? ''),
        classList: {
          contains: (name: string) => {
            return name === 'giscus-frame--loading' && !frameLoaded;
          },
        },
        contentWindow: {
          // postMessage hands the frame a structured clone, in this realm.
          postMessage: (data: unknown, origin: string) => {
            page.messages.push([structuredClone(data), origin]);
          },
        },
      };
      page.scripts = [];
      page.frame = frame;
    },
    // What applyTheme() in ThemeSwitcher.astro does.
    switchTheme: (theme: string) => {
      page.theme = theme;
      window.dispatchEvent(new Event('theme-changed'));
    },
  };
}

// client.js builds the frame URL from the page and its script, the theme among
// the other parameters, which a theme switch must keep.
export function widgetUrl(theme: string) {
  const params = { origin: 'https://kalinichenko.dev/blog/a/', session: '', theme, term: 'blog/a' };

  return `https://giscus.app/en/widget?${new URLSearchParams(params)}`;
}
