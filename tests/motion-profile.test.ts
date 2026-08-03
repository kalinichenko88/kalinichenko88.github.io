import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_MOTION_PROFILE,
  MOTION_CHANGED_EVENT,
  MOTION_OPTIONS,
  MOTION_STORAGE_KEY,
  isMotionProfile,
  resolveMotionProfile,
} from '../src/config/motion.ts';

test('exposes the three profiles in UI order', () => {
  assert.deepEqual(
    MOTION_OPTIONS.map(({ id }) => id),
    ['calm', 'expressive', 'experimental']
  );
});

test('uses stable persistence and event names', () => {
  assert.equal(DEFAULT_MOTION_PROFILE, 'calm');
  assert.equal(MOTION_STORAGE_KEY, 'motion-profile');
  assert.equal(MOTION_CHANGED_EVENT, 'motion-changed');
});

test('validates and resolves stored values', () => {
  assert.equal(isMotionProfile('expressive'), true);
  assert.equal(isMotionProfile('loud'), false);
  assert.equal(resolveMotionProfile('experimental'), 'experimental');
  assert.equal(resolveMotionProfile(null), 'calm');
  assert.equal(resolveMotionProfile('loud'), 'calm');
});
