import assert from 'node:assert/strict';
import test from 'node:test';

import { pointerMotion } from '../src/lib/motion-controller.ts';

const rect = { left: 100, top: 50, width: 200, height: 100 };
const caps = { translation: 6, rotation: 3 };

test('centres pointer motion at zero', () => {
  assert.deepEqual(pointerMotion(200, 100, rect, caps), { x: 0, y: 0, rx: 0, ry: 0 });
});

test('caps pointer motion at card edges', () => {
  assert.deepEqual(pointerMotion(300, 150, rect, caps), { x: 6, y: 6, rx: -3, ry: 3 });
});
