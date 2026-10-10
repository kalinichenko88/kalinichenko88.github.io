import assert from 'node:assert/strict';
import test from 'node:test';

import { onScreen, pointerMotion } from '../src/lib/motion-controller.ts';

const rect = { left: 100, top: 50, width: 200, height: 100 };

test('centres pointer motion at zero', () => {
  assert.deepEqual(pointerMotion(200, 100, rect, 6), { x: 0, y: 0 });
});

test('caps pointer motion at card edges', () => {
  assert.deepEqual(pointerMotion(300, 150, rect, 6), { x: 6, y: 6 });
  assert.deepEqual(pointerMotion(0, 0, rect, 6), { x: -6, y: -6 });
});

// Measured on /blog at 1280x900: a masonry card 88px into the viewport stayed
// hidden because it was under 18% visible, leaving a blank band until scroll.
test('counts a block as on screen however little of it shows', () => {
  assert.equal(onScreen({ top: 812, bottom: 1253 }, 900), true);
  assert.equal(onScreen({ top: 709, bottom: 1148 }, 720), true);
});

test('does not count a block below or above the viewport', () => {
  assert.equal(onScreen({ top: 900, bottom: 1341 }, 900), false);
  assert.equal(onScreen({ top: -441, bottom: 0 }, 900), false);
});
