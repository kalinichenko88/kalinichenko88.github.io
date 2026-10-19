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

type FakeNode = { backgroundColor: string; parentElement: FakeNode | null };

// An element and its ancestors, innermost first and ending at <body>, as the
// computed backgroundColor of each, recorded in Chrome on the built site.
function chain(...fills: string[]): Element {
  const body: FakeNode = { backgroundColor: fills.at(-1)!, parentElement: null };
  let node = body;
  for (const backgroundColor of fills.slice(0, -1).reverse()) {
    node = { backgroundColor, parentElement: node };
  }
  Object.assign(globalThis, { document: { body }, getComputedStyle: (n: FakeNode) => n });
  return node as unknown as Element;
}

const NONE = 'rgba(0, 0, 0, 0)';

test('does not count the fill of inline code as covering its paragraph', () => {
  // code < p < .prose < .container < article < main < body, on a post
  const code = chain('rgb(236, 235, 229)', NONE, NONE, NONE, NONE, NONE, 'rgb(244, 242, 238)');
  assert.equal(onOpaqueFill(code), false);
});

test('counts the fill of a card as covering the link on it', () => {
  // overlay a < article.card < .columns < .container < section < main < body, on /blog
  const link = chain(NONE, 'rgb(255, 255, 255)', NONE, NONE, NONE, NONE, 'rgb(244, 242, 238)');
  assert.equal(onOpaqueFill(link), true);
});
