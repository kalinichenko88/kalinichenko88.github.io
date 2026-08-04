import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

test('performs pointer layout reads inside the scheduled frame', async () => {
  const source = await readFile(
    new URL('../src/lib/motion-controller.ts', import.meta.url),
    'utf8'
  );
  const scheduledFrame = source.indexOf('this.frame = requestAnimationFrame');
  const geometryRead = source.indexOf('getBoundingClientRect()');
  const styleRead = source.indexOf('getComputedStyle(document.documentElement)');

  assert.ok(scheduledFrame >= 0);
  assert.ok(geometryRead > scheduledFrame);
  assert.ok(styleRead > scheduledFrame);
});

test('snaps swapped-in elements to the hidden state before observing them', async () => {
  const source = await readFile(
    new URL('../src/lib/motion-controller.ts', import.meta.url),
    'utf8'
  );
  const initPage = source.slice(
    source.indexOf('initPage()'),
    source.indexOf('private onPointerMove')
  );
  const add = initPage.indexOf("classList.add('is-motion-reset')");
  const flush = initPage.indexOf('offsetHeight');
  const remove = initPage.indexOf("classList.remove('is-motion-reset')");
  const observe = initPage.indexOf('new IntersectionObserver');

  // Without the forced style flush between add and remove the browser never
  // computes the hidden state, and the reveal transition is skipped.
  assert.ok(add >= 0 && flush > add && remove > flush && observe > remove);
});
