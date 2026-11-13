import {
  accentFillHex,
  accentTextHex,
  DEFAULT_ACCENT,
  isAccentId,
  type AccentId,
} from './accents';
import { DEFAULT_THEME, isThemePreference, resolveTheme, type ThemeId, type ThemePreference } from '../themes';
import { loadSettings, saveSettings } from './platform';

let theme = $state<ThemePreference>(DEFAULT_THEME);
let accent = $state<AccentId>(DEFAULT_ACCENT);
let systemPrefersDark = $state(false);
let saveError = $state('');
let loadError = $state('');
let watched = false;

function apply() {
  const root = document.documentElement;
  const resolved = resolveTheme(theme, systemPrefersDark);
  root.dataset.theme = resolved;
  root.style.setProperty('--accent-bg', accentFillHex(accent));
  root.style.setProperty('--accent-text', accentTextHex(accent, resolved === 'dark'));
}

// A system-theme change applies while the app is open. The listener is made
// once, on load.
function watchSystem() {
  if (watched) return;
  watched = true;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  systemPrefersDark = media.matches;
  media.addEventListener('change', (event) => {
    systemPrefersDark = event.matches;
    if (theme === 'system') apply();
  });
}

function describe(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  return String(error);
}

// Saves run one after another, so two quick changes cannot interleave their
// store writes. A failure sets saveError for the page to show and the promise
// still resolves. `data-settings-saving` on the root
// element is true while a save is pending, which lets an end-to-end test wait
// for the write before it restarts the app.
let saving: Promise<void> = Promise.resolve();
let pending = 0;

function markSaving() {
  document.documentElement.dataset.settingsSaving = String(pending > 0);
}

function save() {
  const values = { theme, accent };
  saveError = '';
  pending += 1;
  markSaving();
  saving = saving
    .then(() => saveSettings(values))
    .catch((error: unknown) => {
      saveError = `Could not save your settings. ${describe(error)}`;
    })
    .finally(() => {
      pending -= 1;
      markSaving();
    });
  return saving;
}

export const settings = {
  get theme() {
    return theme;
  },
  get resolvedTheme(): ThemeId {
    return resolveTheme(theme, systemPrefersDark);
  },
  get accent() {
    return accent;
  },
  get saveError() {
    return saveError;
  },
  get loadError() {
    return loadError;
  },

  // Reads the saved settings and applies them. Unknown values fall back to
  // the defaults.
  async load() {
    watchSystem();
    let saved: Awaited<ReturnType<typeof loadSettings>>;
    try {
      saved = await loadSettings();
      loadError = '';
    } catch (error) {
      saved = {};
      loadError = `Could not load your settings, so the defaults are showing. ${describe(error)}`;
    }
    theme = isThemePreference(saved.theme) ? saved.theme : DEFAULT_THEME;
    accent = isAccentId(saved.accent) ? saved.accent : DEFAULT_ACCENT;
    apply();
  },

  setTheme(id: ThemePreference) {
    theme = id;
    apply();
    return save();
  },

  setAccent(id: AccentId) {
    accent = id;
    apply();
    return save();
  },
};
