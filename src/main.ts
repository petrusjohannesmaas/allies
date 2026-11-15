import './app.css';
import './themes';
import { mount } from 'svelte';
import App from './App.svelte';
import { settings } from './lib/settings.svelte';

// The WebdriverIO plugin has to load before the app makes its first call, and
// only the end-to-end builds set VITE_E2E.
if (import.meta.env.VITE_E2E) {
  await import('@wdio/tauri-plugin');
}

const target = document.getElementById('app');
if (!target) {
  throw new Error('Missing #app element');
}

// Saved settings load first, so the first frame has the theme and accent.
await settings.load();

export default mount(App, { target });