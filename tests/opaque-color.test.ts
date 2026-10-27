import assert from 'node:assert/strict';
import test from 'node:test';

import { isOpaque, onOpaqueFill } from '../src/lib/opaque-color.ts';

// Computed backgroundColor values recorded in Chrome on the built site.
test('counts translucent fills as translucent and solid ones as opaque', () => {
  for (const color of [
    'oklab(0.939169 -0.00120389 0.00799549 / 0.85)', // the /85 bands
    'oklab(0.961572 0.000587583 0.00573373 / 0.8)', // the /80 header
    'color(srgb 0.760784 0.352941 0.203922 / 0.12)', // the topic chip
    'rgba(0, 0, 0, 0)', // no fill
  ]) {
    assert.equal(isOpaque(color), false, color);
  }
  assert.equal(isOpaque('rgb(35, 35, 38)'), true); // a card
});

type FakeNode = {
  backgroundColor: string;
  parentElement: FakeNode | null;
  matches: (selector: string) => boolean;
};

// An element and its ancestors, innermost first and ending at <body>, each as
// `tag` or `tag:backgroundColor` (no colour is no fill), recorded in Chrome on
// the built site.
function chain(...nodes: string[]): Element {
  const fakes: FakeNode[] = nodes.map((node) => {
    const [tag, backgroundColor = 'rgba(0, 0, 0, 0)'] = node.split(':');

    return {
      backgroundColor,
      parentElement: null,
      matches: (s) => {
        return s.split(', ').includes(tag);
      },
    };
  });
  fakes.forEach((node, i) => {
    node.parentElement = fakes[i + 1] ?? null;
  });
  const body = fakes.at(-1);
  Object.assign(globalThis, {
    document: { body },
    getComputedStyle: (n: FakeNode) => {
      return n;
    },
  });

  return fakes[0] as unknown as Element;
}

const BODY = 'body:rgb(244, 242, 238)';

test('does not count the fill of inline code as covering its paragraph', () => {
  // inline code in a post paragraph: code < p < .prose < .container < article < main
  const code = chain('code:rgb(236, 235, 229)', 'p', 'div', 'div', 'article', 'main', BODY);
  assert.equal(onOpaqueFill(code), false);
});

test('does not count a code block as covering the code in it', () => {
  // the cursor on code text hits `code`, inside the opaque shiki `pre`
  const code = chain('code', 'pre:rgb(36, 41, 46)', 'div', 'div', 'article', 'main', BODY);
  assert.equal(onOpaqueFill(code), false);
});

test('counts the fill of a card as covering the link on it', () => {
  // the overlay link on a /blog card: a < article.card < .columns < .container < section < main
  const link = chain('a', 'article:rgb(255, 255, 255)', 'div', 'div', 'section', 'main', BODY);
  assert.equal(onOpaqueFill(link), true);
});
