import assert from 'node:assert/strict';
import test from 'node:test';

import { isOpaque } from '../src/lib/opaque-color.ts';

// Every value below is a computed backgroundColor recorded in Chrome on the
// built site, both themes.

test('counts the /85 bands and the /80 header as translucent', () => {
  // bg-background-subtle/85: the homepage Writing band and the About Expertise band
  assert.equal(isOpaque('oklab(0.939169 -0.00120389 0.00799549 / 0.85)'), false);
  assert.equal(isOpaque('oklab(0.244346 0.00105315 -0.00360098 / 0.85)'), false);
  // the header's bg-background/80
  assert.equal(isOpaque('oklab(0.961572 0.000587583 0.00573373 / 0.8)'), false);
  assert.equal(isOpaque('oklab(0.218625 0.00107917 -0.00370586 / 0.8)'), false);
});

test('counts a color() tint as translucent', () => {
  // the topic chip
  assert.equal(isOpaque('color(srgb 0.760784 0.352941 0.203922 / 0.12)'), false);
});

test('counts no background as translucent', () => {
  assert.equal(isOpaque('rgba(0, 0, 0, 0)'), false);
});

test('counts a solid fill as opaque', () => {
  // a card, a code block
  assert.equal(isOpaque('rgb(35, 35, 38)'), true);
  assert.equal(isOpaque('rgb(36, 41, 46)'), true);
});
