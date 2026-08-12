import assert from 'node:assert/strict';
import test from 'node:test';

import { pointerMotion } from '../src/lib/motion-controller.ts';

const rect = { left: 100, top: 50, width: 200, height: 100 };

test('centres pointer motion at zero', () => {
  assert.deepEqual(pointerMotion(200, 100, rect, 6), { x: 0, y: 0 });
});

test('caps pointer motion at card edges', () => {
  assert.deepEqual(pointerMotion(300, 150, rect, 6), { x: 6, y: 6 });
  assert.deepEqual(pointerMotion(0, 0, rect, 6), { x: -6, y: -6 });
});
