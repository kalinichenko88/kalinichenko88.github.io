type Theme = {
  id: string;
  label: string;
  iconId: string;
};

/**
 * The two `data-theme` values. Load-bearing: also the localStorage payload and
 * the giscus theme mapping keys. Everything else derives from these.
 */
export const LIGHT_THEME = 'cloud';
export const DARK_THEME = 'cloud-dark';

/** Selectable options, in cycle order. `auto` follows the system preference. */
export const THEME_OPTIONS: Theme[] = [
  { id: 'auto', label: 'Auto', iconId: 'monitor' },
  { id: LIGHT_THEME, label: 'Light', iconId: 'sun' },
  { id: DARK_THEME, label: 'Dark', iconId: 'moon' },
];

/** Map a stored preference to the `data-theme` value to apply. */
export function resolveTheme(preference: string | null): string {
  if (preference === LIGHT_THEME || preference === DARK_THEME) return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
}
