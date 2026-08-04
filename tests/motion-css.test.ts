import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');

test('defines motion tokens and progressive enhancement guards', () => {
  assert.match(css, /--motion-reveal-distance:/);
  assert.match(css, /\[data-motion-limit\]/);
  assert.match(css, /\[data-motion-ready\] \[data-reveal\]/);
  assert.match(css, /@supports \(animation-timeline: view\(\)\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('carries no leftover profile selectors', () => {
  assert.doesNotMatch(css, /\[data-motion=/);
  assert.doesNotMatch(css, /motion-word/);
});

test('hidden states stay gated on data-motion-ready so no-JS renders content', () => {
  assert.match(css, /\[data-motion-ready\] \[data-reveal\] {[^}]*opacity: 0/s);
  assert.match(css, /\[data-motion-ready\] \.divider::after {[^}]*scaleX\(0\)/s);
});

test('does not add a JavaScript scroll listener', async () => {
  const controller = await readFile(
    new URL('../src/lib/motion-controller.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(controller, /addEventListener\(['"]scroll/);
});

test('reduced motion overrides every reveal', () => {
  const reducedMotion = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reducedMotion, /\[data-motion-ready\] \[data-reveal\]/);
  assert.match(reducedMotion, /\.divider::after/);
  assert.match(reducedMotion, /\.scroll-progress/);
});

test('staggers reveal properties without delaying card interaction', () => {
  assert.match(css, /\.card-lift:hover\s*{[^}]*--card-lift-y:[^}]*transform:/s);
  assert.match(
    css,
    /transition:\s*opacity[^;]+translate[^;]+transform[^;]+box-shadow[^;]+border-color/s
  );
  assert.match(
    css,
    /transition-delay:\s*(?:calc\(var\(--motion-index, 0\) \* var\(--motion-stagger\)\),\s*){2}0ms,/
  );
});

test('motion reset bypasses transitions and outranks the reveal rules', () => {
  assert.match(css, /\[data-reveal\]\.is-motion-reset[^{]*{[^}]*transition: none/s);
  // Equal specificity to the rules it overrides, so source order decides.
  assert.ok(
    css.indexOf('.is-motion-reset') > css.lastIndexOf('.divider.is-revealed::after'),
    'is-motion-reset must come after the reveal rules'
  );
});
