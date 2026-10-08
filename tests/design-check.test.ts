import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// The design-check skill's hard rules (contrast on every fill, forbidden
// leftovers, theme ids) gate CI too, so reverting a fix fails here.
test('design-check hard rules pass', () => {
  const run = spawnSync(process.execPath, ['.claude/skills/design-check/check-design.mjs'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
});
