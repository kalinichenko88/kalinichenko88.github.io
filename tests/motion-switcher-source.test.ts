import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('layout mounts and initializes the global motion switcher', async () => {
  const layout = await read('src/components/Layout.astro');
  assert.match(layout, /import MotionSwitcher from '.\/MotionSwitcher\.astro'/);
  assert.match(layout, /data-motion-key=/);
  assert.match(layout, /astro:before-swap/);
  assert.match(layout, /<MotionSwitcher \/>/);
});

test('switcher uses native radio controls and accessible state', async () => {
  const component = await read('src/components/MotionSwitcher.astro');
  assert.match(component, /<fieldset/);
  assert.match(component, /type="radio"/);
  assert.match(component, /aria-expanded="false"/);
  assert.match(component, /MOTION_CHANGED_EVENT/);
  assert.match(component, /disconnectedCallback/);
});
