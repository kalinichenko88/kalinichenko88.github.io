type Theme = {
  id: string;
  label: string;
  iconId: string;
};

export const THEMES: Theme[] = [
  { id: 'cloud', label: 'Light', iconId: 'sun' },
  { id: 'cloud-dark', label: 'Dark', iconId: 'moon' },
  { id: 'terminal', label: 'Terminal', iconId: 'terminal' },
];

export const AUTO_THEME: Theme = { id: 'auto', label: 'Auto', iconId: 'monitor' };

export const ALL_THEME_OPTIONS: Theme[] = [AUTO_THEME, ...THEMES];

export const THEME_IDS = THEMES.map((t) => t.id);
export const ALL_OPTION_IDS = ALL_THEME_OPTIONS.map((t) => t.id);

export const DEFAULT_LIGHT_THEME = 'cloud';
export const DEFAULT_DARK_THEME = 'cloud-dark';

export function isValidPreference(pref: string | null): boolean {
  return pref !== null && ALL_OPTION_IDS.includes(pref);
}

export function isValidTheme(theme: string | null): boolean {
  return theme !== null && THEME_IDS.includes(theme);
}

export function resolveTheme(preference: string, isDark: boolean): string {
  if (preference === 'auto' || !THEME_IDS.includes(preference)) {
    return isDark ? DEFAULT_DARK_THEME : DEFAULT_LIGHT_THEME;
  }
  return preference;
}
