#!/usr/bin/env node
/* eslint-disable no-console */
/* global console, process */
// Design-system checker for kalinichenko.dev.
// Mechanical half of the `design-check` skill: mirrors what google-labs-code/design.md's
// CLI `lint` does (WCAG contrast + structural rules), with zero dependencies.
// Rules come from DESIGN.md; the authoritative values live in src/styles/global.css.
//
// Usage:
//   node .claude/skills/design-check/check-design.mjs            # audit the repo
//   node .claude/skills/design-check/check-design.mjs --selftest # verify the contrast math
//
// Exit code 1 if any HARD check fails (contrast, forbidden patterns, theme ids).
// Advisory findings (em-dash in UI copy) are printed but do not fail the run.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const CSS = join(ROOT, 'src/styles/global.css');
const THEMES = join(ROOT, 'src/config/themes.ts');

// ---------- WCAG contrast ----------
function toRgb(hex) {
  const h = hex.replace('#', '').trim();
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
}
function relLum(hex) {
  const [r, g, b] = toRgb(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// ---------- token parsing ----------
function themeBlock(css, selector) {
  const start = css.indexOf(selector);
  if (start === -1) return {};
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const body = css.slice(open + 1, close);
  const tokens = {};
  for (const m of body.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]+)/g)) {
    tokens[m[1]] = m[2];
  }
  return tokens;
}

// ---------- file walk ----------
function walk(dir, exts) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

const AA = 4.5;
let hardFail = 0;
const line = (ok, msg) => console.log(`  ${ok ? '✓' : '✗'} ${msg}`);

// ---------- self-test ----------
if (process.argv.includes('--selftest')) {
  console.log('Self-test (contrast math):');
  const cases = [
    ['#000000', '#ffffff', 21, true],
    ['#ffffff', '#c25a34', AA, false], // old bright accent button -> must FAIL AA
    ['#ffffff', '#a94a29', AA, true], // AA-safe accent-text -> must PASS
    ['#a94a29', '#f4f2ee', AA, true], // accent-text on light bg -> PASS
  ];
  let bad = 0;
  for (const [a, b, thr, shouldPass] of cases) {
    const c = contrast(a, b);
    const pass = c >= thr;
    const ok = pass === shouldPass;
    if (!ok) bad++;
    line(ok, `contrast(${a}, ${b}) = ${c.toFixed(2)} -> ${pass ? 'AA' : 'fail'} (expected ${shouldPass ? 'AA' : 'fail'})`);
  }
  console.log(bad ? `\nSELF-TEST FAILED (${bad})` : '\nSelf-test OK');
  process.exit(bad ? 1 : 0);
}

const css = readFileSync(CSS, 'utf8');
const light = themeBlock(css, "[data-theme='cloud']");
const dark = themeBlock(css, "[data-theme='cloud-dark']");

// ---------- 1. contrast (hard) ----------
console.log('Contrast (WCAG AA >= 4.5 for small text/CTA):');
const pairs = [
  ['light accent-text on bg', light['accent-text'], light['bg']],
  ['light CTA text (white) on button fill (accent-text)', '#ffffff', light['accent-text']],
  ['dark accent-text on bg', dark['accent-text'], dark['bg']],
  ['dark CTA text (bg) on button fill (accent)', dark['bg'], dark['accent']],
];
for (const [label, a, b] of pairs) {
  if (!a || !b) {
    line(false, `${label}: MISSING token`);
    hardFail++;
    continue;
  }
  const c = contrast(a, b);
  const ok = c >= AA;
  if (!ok) hardFail++;
  line(ok, `${label}: ${c.toFixed(2)}:1`);
}

// ---------- 2. forbidden patterns (hard) ----------
console.log('\nForbidden patterns in src/:');
const files = walk(join(ROOT, 'src'), ['.astro', '.css', '.ts', '.js']);
const forbidden = [
  ['old purple accent', /7c5cff|124,\s*92,\s*255|155,\s*127,\s*255/i],
  ['numbered/eyebrow label class', /section-label/],
  ['removed terminal theme', /data-theme=['"]terminal['"]/],
  ['removed grid-pattern', /grid-pattern/],
  ['dropped General Sans', /general[-\s]?sans/i],
  ['dead hero code block', /code-block-hero|hero-particles/],
];
for (const [label, re] of forbidden) {
  const hits = [];
  for (const f of files) {
    readFileSync(f, 'utf8')
      .split('\n')
      .forEach((l, i) => re.test(l) && hits.push(`${f.replace(ROOT + '/', '')}:${i + 1}`));
  }
  if (hits.length) hardFail++;
  line(hits.length === 0, `no ${label}${hits.length ? ' -> ' + hits.slice(0, 5).join(', ') : ''}`);
}

// ---------- 3. theme-id integrity (hard) ----------
console.log('\nTheme ids (must stay cloud / cloud-dark for giscus + localStorage):');
const themes = readFileSync(THEMES, 'utf8');
for (const id of ['cloud', 'cloud-dark']) {
  const ok = new RegExp(`id:\\s*['"]${id}['"]`).test(themes);
  if (!ok) hardFail++;
  line(ok, `id '${id}' present`);
}
const noTerminalId = !/id:\s*['"]terminal['"]/.test(themes);
if (!noTerminalId) hardFail++;
line(noTerminalId, "no 'terminal' theme id");

// ---------- 4. em-dash in UI copy (advisory) ----------
console.log('\nEm-dash / en-dash in .astro/.ts UI copy (advisory - review each):');
const astro = walk(join(ROOT, 'src'), ['.astro', '.ts']);
const dashHits = [];
for (const f of astro) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((l, i) => /[—–]/.test(l) && dashHits.push(`${f.replace(ROOT + '/', '')}:${i + 1}`));
}
if (dashHits.length === 0) line(true, 'none found');
else dashHits.forEach((h) => console.log(`  ! ${h}`));

// ---------- verdict ----------
console.log('');
if (hardFail) {
  console.log(`DESIGN CHECK FAILED: ${hardFail} hard issue(s). See DESIGN.md.`);
  process.exit(1);
}
console.log('DESIGN CHECK PASSED (hard checks). Review any advisory items above.');
