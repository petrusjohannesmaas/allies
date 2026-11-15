import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeStore } from '../test/fake-store';

let settings: typeof import('./settings.svelte').settings;

const root = document.documentElement;
const styleVar = (name: string) => root.style.getPropertyValue(name);

// A controllable prefers-color-scheme query.
function fakeMedia(dark: boolean) {
  const listeners: ((event: { matches: boolean }) => void)[] = [];
  vi.spyOn(window, 'matchMedia').mockImplementation(
    () =>
      ({
        matches: dark,
        addEventListener: (_: string, fn: (event: { matches: boolean }) => void) => listeners.push(fn),
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
  return (next: boolean) => listeners.forEach((fn) => fn({ matches: next }));
}

beforeEach(async () => {
  vi.resetModules();
  ({ settings } = await import('./settings.svelte'));
  root.removeAttribute('data-theme');
  for (const name of ['--accent-bg', '--primary-foreground', '--accent-text']) {
    root.style.removeProperty(name);
  }
});

describe('settings', () => {
  it('starts on System with Blue when nothing is saved', async () => {
    fakeStore();
    fakeMedia(false);
    await settings.load();

    expect(settings.theme).toBe('system');
    expect(root.dataset.theme).toBe('light');
    expect(styleVar('--accent-bg')).toBe('#2576d5');
  });

  it('follows a system switch while on System', async () => {
    fakeStore();
    const fire = fakeMedia(false);
    await settings.load();
    expect(root.dataset.theme).toBe('light');

    fire(true);
    expect(root.dataset.theme).toBe('dark');
  });

  it('applies the saved theme and accent', async () => {
    fakeStore({ theme: 'dark', accent: 'green' });
    fakeMedia(false);
    await settings.load();

    expect(root.dataset.theme).toBe('dark');
    expect(styleVar('--accent-bg')).toBe('#2a863d');
  });

  it('falls back to System and Blue for unknown values', async () => {
    fakeStore({ theme: 'sepia', accent: 'mauve' });
    fakeMedia(false);
    await settings.load();

    expect(settings.theme).toBe('system');
    expect(settings.accent).toBe('blue');
  });

  it('switches theme and accent at once and saves them', async () => {
    const store = fakeStore();
    fakeMedia(false);
    await settings.load();

    const first = settings.setTheme('dark');
    const second = settings.setAccent('purple');
    expect(root.dataset.theme).toBe('dark');
    expect(styleVar('--accent-bg')).toBe('#9141ac');

    await Promise.all([first, second]);
    expect(store.saves.at(-1)).toEqual({ theme: 'dark', accent: 'purple' });
  });

  it('keeps the change when the save fails', async () => {
    const store = fakeStore();
    fakeMedia(false);
    await settings.load();
    store.failing.save = true;

    await settings.setAccent('purple');
    expect(styleVar('--accent-bg')).toBe('#9141ac');
    expect(settings.saveError.startsWith('Could not save your settings')).toBe(true);
  });

  it('uses the defaults when the settings cannot load', async () => {
    const store = fakeStore({ theme: 'dark', accent: 'green' });
    store.failing.load = true;
    fakeMedia(false);
    await settings.load();

    expect(settings.theme).toBe('system');
    expect(settings.accent).toBe('blue');
    expect(settings.loadError.startsWith('Could not load your settings')).toBe(true);
  });

  it('keeps settings.json in the config folder', async () => {
    const store = fakeStore({}, undefined, '/home/u/.config/privatelink.allies');
    fakeMedia(false);
    await settings.load();

    expect(store.paths).toEqual(['/home/u/.config/privatelink.allies/settings.json']);
  });
});
