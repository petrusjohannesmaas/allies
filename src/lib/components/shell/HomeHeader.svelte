<script lang="ts">
  import { Moon, Sun } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import HeaderButton from './HeaderButton.svelte';
  import ProfileMenu from './ProfileMenu.svelte';
  import type { ShellProfile } from './types';

  // The top of the Home page: the title on the left and three icons on the
  // right. `special` is the app's own icon (ICN 1), then the light/dark
  // toggle, then the profile menu. `children` fills the space between them,
  // for a month picker or a search box.
  let {
    title = 'Home',
    dark,
    ontoggletheme,
    profile,
    onopenprofile,
    special,
    children,
  }: {
    title?: string;
    dark: boolean;
    ontoggletheme: () => void;
    profile: ShellProfile;
    onopenprofile: () => void;
    special?: Snippet;
    children?: Snippet;
  } = $props();

  const themeLabel = $derived(dark ? 'Switch to light theme' : 'Switch to dark theme');
</script>

<header class="flex items-center gap-6" data-testid="home-header">
  <h1 class="shrink-0 text-2xl font-semibold">{title}</h1>

  <div class="flex min-w-0 flex-1 items-center gap-4">
    {@render children?.()}
  </div>

  <div class="flex shrink-0 items-center gap-1" data-testid="home-header-icons">
    {@render special?.()}
    <HeaderButton label={themeLabel} testid="theme-toggle" onclick={ontoggletheme}>
      {#if dark}
        <Sun size={20} strokeWidth={1.8} aria-hidden="true" />
      {:else}
        <Moon size={20} strokeWidth={1.8} aria-hidden="true" />
      {/if}
    </HeaderButton>
    <ProfileMenu {profile} {onopenprofile} />
  </div>
</header>
