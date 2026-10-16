import { afterEach, vi } from 'vitest';
import { clearMocks } from '@tauri-apps/api/mocks';
import { randomFillSync } from 'node:crypto';
import { setDb } from '../lib/db';
import { migratedDb } from './sqlite-db';

// The screens read through src/lib/db, which would otherwise reach for the
// Tauri plugin. Each test file gets its own module registry, so each one gets
// its own empty database with the app's schema applied. Tests that care about
// the data make their own Db and pass it to the repository directly.
setDb(migratedDb());

// jsdom has no WebCrypto, which the Tauri mocks reach for.
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: (buffer: Uint8Array) => randomFillSync(buffer),
    randomUUID: () => crypto.randomUUID(),
  },
  configurable: true,
});

// jsdom has no matchMedia, which the theme code reads.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom has no Web Animations API. Svelte waits for onfinish, so the stub
// finishes each animation on the next task.
if (!Element.prototype.animate) {
  Element.prototype.animate = function animate() {
    const animation = {
      cancel: () => {},
      finish: () => {},
      play: () => {},
      pause: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      finished: Promise.resolve(),
      ready: Promise.resolve(),
      playState: 'finished',
      playbackRate: 1,
      currentTime: 0,
      startTime: 0,
      timeline: null,
      effect: null,
      id: '',
      oncancel: null,
      onfinish: null as (() => void) | null,
      onremove: null,
    };
    setTimeout(() => animation.onfinish?.(), 0);
    return animation as unknown as Animation;
  };
}

afterEach(() => {
  clearMocks();
  vi.restoreAllMocks();
});