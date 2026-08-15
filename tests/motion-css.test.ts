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
  // Scoped to [data-reveal]: only those elements ever get is-revealed, so an
  // unscoped rule would hide the mark on a plain divider forever.
  assert.match(css, /\[data-motion-ready\] \.divider\[data-reveal\]::after {[^}]*scaleX\(0\)/s);
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

// Comments here explain the very hazards these tests guard, so matching
// against them would pass on prose alone.
const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');

function rule(selector: RegExp) {
  const found = bare.match(selector);
  assert.ok(found, `no rule matching ${selector}`);
  return found[0];
}

const hidden = () => rule(/\[data-motion-ready\] \[data-reveal\] {[^}]*}/s);

test('declares the reveal transition only on the revealed state', () => {
  // Nodes swapped in by ClientRouter arrive from an unstyled document at
  // opacity 1, so a transition on the hidden state animates 1 -> 0 on insert
  // and the page sinks on every client-side navigation.
  assert.doesNotMatch(hidden(), /transition:[^;]*\b(?:opacity|translate)\b/s);
  assert.match(
    bare,
    /\[data-reveal\]\.is-revealed {[^}]*transition:[^;]*opacity[^;]*translate/s,
    'the reveal transition belongs on .is-revealed'
  );
  assert.doesNotMatch(rule(/\.divider\[data-reveal\]::after {[^}]*}/s), /transition:/);
  assert.match(bare, /\.divider\[data-reveal\]\.is-revealed::after {[^}]*transition: transform/s);
});

test('keeps scroll depth on its own element, gated like every other motion state', () => {
  // One transitioned property cannot carry two motion sources: the transition
  // freezes its endpoints while the timeline keeps moving the other term. And
  // the timeline is pure CSS, so an ungated rule keeps the cards drifting with
  // JavaScript off while every other block has gone static.
  assert.doesNotMatch(hidden(), /translate:[^;]*--motion-scroll-depth-y/);
  assert.match(bare, /\[data-scroll-depth\] {\s*translate: 0 var\(--motion-scroll-depth-y\)/);
  const selectors = [...bare.matchAll(/[^{}]*\[data-scroll-depth\][^{}]*(?={)/g)];
  assert.ok(selectors.length, 'no scroll-depth rules');
  for (const [selector] of selectors) {
    assert.match(selector, /\[data-motion-ready\]/, `ungated: ${selector.trim()}`);
  }
});
