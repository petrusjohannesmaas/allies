import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// runes: true keeps every component in Svelte 5 runes mode, so the Svelte 4
// syntax fails to compile instead of quietly working in one file.
export default {
  preprocess: vitePreprocess(),
  compilerOptions: { runes: true },
};