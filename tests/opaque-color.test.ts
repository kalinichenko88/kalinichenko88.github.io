import assert from 'node:assert/strict';
import test from 'node:test';

import { isOpaque } from '../src/lib/opaque-color.ts';

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
