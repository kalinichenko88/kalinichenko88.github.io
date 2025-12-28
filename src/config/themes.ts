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

export const THEME_IDS = THEMES.map((t) => t.id);

export const DEFAULT_LIGHT_THEME = 'cloud';
export const DEFAULT_DARK_THEME = 'cloud-dark';

export function isValidTheme(theme: string | null): boolean {
  return theme !== null && THEME_IDS.includes(theme);
}
