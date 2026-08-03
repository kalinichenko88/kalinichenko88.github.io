export const MOTION_OPTIONS = [
  { id: 'calm', label: 'Calm', description: 'Soft reveals and minimal movement.' },
  { id: 'expressive', label: 'Expressive', description: 'Layered reveals and reactive cards.' },
  {
    id: 'experimental',
    label: 'Experimental',
    description: 'Kinetic type and scroll-linked depth.',
  },
] as const;

export type MotionOption = (typeof MOTION_OPTIONS)[number];
export type MotionProfile = MotionOption['id'];

export const DEFAULT_MOTION_PROFILE: MotionProfile = 'calm';
export const MOTION_STORAGE_KEY = 'motion-profile';
export const MOTION_CHANGED_EVENT = 'motion-changed';

const PROFILE_IDS = new Set<string>(MOTION_OPTIONS.map(({ id }) => id));

export function isMotionProfile(value: unknown): value is MotionProfile {
  return typeof value === 'string' && PROFILE_IDS.has(value);
}

export function resolveMotionProfile(value: unknown): MotionProfile {
  return isMotionProfile(value) ? value : DEFAULT_MOTION_PROFILE;
}
