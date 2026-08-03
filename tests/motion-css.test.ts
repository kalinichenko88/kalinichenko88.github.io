import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');

test('defines all motion profiles and progressive enhancement guards', () => {
  assert.match(css, /\[data-motion='calm'\]/);
  assert.match(css, /\[data-motion='expressive'\]/);
  assert.match(css, /\[data-motion='experimental'\]/);
  assert.match(css, /\[data-motion-ready\] \[data-reveal\]/);
  assert.match(css, /@supports \(animation-timeline: view\(\)\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('does not add a JavaScript scroll listener', async () => {
  const controller = await readFile(
    new URL('../src/lib/motion-controller.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(controller, /addEventListener\(['"]scroll/);
});

test('reduced motion overrides profile-only choreography', () => {
  const reducedMotion = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(
    reducedMotion,
    /\[data-motion-ready\]\[data-motion='experimental'\] \.hero-name \.motion-word/
  );
  assert.match(reducedMotion, /\.divider::after/);
  assert.match(reducedMotion, /\.scroll-progress/);
});

test('staggers reveal properties without delaying card interaction', () => {
  assert.match(css, /\.card-lift:hover\s*{[^}]*--card-lift-y:[^}]*transform:/s);
  assert.match(
    css,
    /transition:\s*opacity[^;]+translate[^;]+rotate[^;]+transform[^;]+box-shadow[^;]+border-color/s
  );
  assert.match(
    css,
    /transition-delay:\s*(?:calc\(var\(--motion-index, 0\) \* var\(--motion-stagger\)\),\s*){3}0ms,/
  );
});

test('replay reset bypasses transitions while restoring the hidden state', () => {
  assert.match(css, /\[data-reveal\]\.is-replay-reset\s*{[^}]*transition: none/s);
});
