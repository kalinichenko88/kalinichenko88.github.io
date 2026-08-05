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

test('never pairs the animation shorthand with animation-timeline', () => {
  // Lightning CSS folds them into one shorthand that browsers reject, which
  // silently kills the animation in the built CSS only. Longhands survive.
  for (const [rule] of css.matchAll(/{[^}]*animation-timeline:[^}]*}/gs)) {
    assert.doesNotMatch(rule, /\banimation:\s/, `shorthand + timeline in: ${rule}`);
  }
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
    /transition-delay:\s*(?:calc\(min\(var\(--motion-index, 0\), 4\) \* var\(--motion-stagger\)\),\s*){2}0ms,/
  );
});

test('gates the hidden state before first paint and drops it if the bundle dies', async () => {
  const layout = await readFile(new URL('../src/components/Layout.astro', import.meta.url), 'utf8');
  const head = layout.slice(0, layout.indexOf('</head>'));
  assert.match(head, /dataset\.motionReady = ''/, 'gate must be set in <head>');
  assert.match(head, /delete document\.documentElement\.dataset\.motionReady/, 'needs a fallback');
  // The swap drops root attributes the incoming document lacks.
  assert.match(
    head,
    /astro:before-swap[\s\S]{0,200}newDocument\.documentElement\.dataset\.motionReady/,
    'gate must be carried across view transitions'
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
