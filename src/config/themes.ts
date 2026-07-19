type Theme = {
  id: string;
  label: string;
  iconId: string;
};

/**
 * Selectable options, in cycle order. `auto` follows the system preference.
 *
 * The ids `cloud` / `cloud-dark` are load-bearing: they are the `data-theme`
 * values, the localStorage payload, and the giscus theme mapping. Do not rename.
 */
export const THEME_OPTIONS: Theme[] = [
  { id: 'auto', label: 'Auto', iconId: 'monitor' },
  { id: 'cloud', label: 'Light', iconId: 'sun' },
  { id: 'cloud-dark', label: 'Dark', iconId: 'moon' },
];

/** Map a stored preference to the `data-theme` value to apply. */
export function resolveTheme(preference: string | null): string {
  if (preference === 'cloud' || preference === 'cloud-dark') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'cloud-dark' : 'cloud';
}
