import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { AA, contrast, mix } from '../.claude/skills/design-check/colors.mjs';

// The design-check skill's hard rules (contrast on every fill, forbidden
// leftovers, theme ids) gate CI too, so reverting a fix fails here.
test('design-check hard rules pass', () => {
  const run = spawnSync(process.execPath, ['.claude/skills/design-check/check-design.mjs'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
});

// The hard rules are only as good as the math they run on.
test('design-check contrast math gives the known values', () => {
  const cases: [string, string, number, boolean][] = [
    ['#000000', '#ffffff', 21, true],
    ['#ffffff', '#c25a34', AA, false], // old bright accent button -> must FAIL AA
    ['#ffffff', '#a94a29', AA, true], // AA-safe accent-text -> must PASS
    ['#a94a29', '#f4f2ee', AA, true], // accent-text on light bg -> PASS
  ];
  for (const [a, b, threshold, passes] of cases) {
    assert.equal(contrast(a, b) >= threshold, passes, `contrast(${a}, ${b})`);
  }
  // The weight belongs to the first color; swapped, this gives #bfbfbf.
  assert.equal(mix('#ffffff', 0.25, '#000000'), '#404040');
});
