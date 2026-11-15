import './light.css';
import './dark.css';

// Each theme is one CSS file that sets the colour variables on
// :root[data-theme="<id>"]. The saved preference also has `system`, which
// follows the system and sets `data-theme` to light or dark.
export const themes = [
  { id: 'system', name: 'System' },
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
] as const;

export type ThemePreference = (typeof themes)[number]['id'];
export type ThemeId = 'light' | 'dark';

export const DEFAULT_THEME: ThemePreference = 'system';

export function isThemePreference(value: unknown): value is ThemePreference {
  return themes.some((theme) => theme.id === value);
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ThemeId {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}
