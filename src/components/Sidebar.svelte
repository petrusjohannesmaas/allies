<script lang="ts">
  import { BookOpen, LayoutDashboard, Moon, Palette, Sun, Users } from '@lucide/svelte';
  import type { Component } from 'svelte';
  // The CSP has no data: in img-src, so the logo must stay a file and not inline.
  import logo from '../assets/logo.png?no-inline';
  import { navigation, open, screens, type Screen } from '$lib/navigation.svelte';
  import { settings } from '$lib/settings.svelte';
  import SearchBox from './SearchBox.svelte';

  const icons: Partial<Record<Screen, Component>> = {
    dashboard: LayoutDashboard,
    contacts: Users,
    journal: BookOpen,
  };

  const item =
    'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-primary-foreground/85 transition-colors hover:bg-white/15 hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-white';
  const current = 'bg-white/20 text-primary-foreground';

  function toggleTheme() {
    void settings.setTheme(settings.resolvedTheme === 'dark' ? 'light' : 'dark');
  }
</script>

<!-- The content panel overlaps the sidebar by 24px (-ml-6 in App.svelte). The
     right padding keeps the items 24px clear of the panel. The aside sets no
     z-index, so the search results can rise above the panel. -->
<aside
  class="flex w-60 shrink-0 flex-col gap-4 bg-[var(--accent-bg)] py-4 pr-10 pl-4 text-primary-foreground"
  data-testid="sidebar"
  aria-label="Main"
>
  <div class="flex items-center gap-3 px-1">
    <img src={logo} alt="Allies" class="size-9 shrink-0 rounded-xl" />
    <span class="text-lg font-semibold">Allies</span>
  </div>

  <SearchBox />

  <nav class="flex flex-1 flex-col gap-1" aria-label="Screens">
    {#each screens as entry (entry.screen)}
      {@const Icon = icons[entry.screen]}
      <button
        type="button"
        class="{item} {navigation.screen === entry.screen ? current : ''}"
        aria-current={navigation.screen === entry.screen ? 'page' : undefined}
        onclick={() => open(entry.screen)}
      >
        {#if Icon}<Icon size={20} strokeWidth={1.8} aria-hidden="true" />{/if}
        {entry.label}
      </button>
    {/each}
  </nav>

  <div class="flex flex-col gap-1" data-testid="sidebar-footer">
    <button
      type="button"
      class="{item} {navigation.screen === 'appearance' ? current : ''}"
      aria-current={navigation.screen === 'appearance' ? 'page' : undefined}
      data-testid="sidebar-appearance"
      onclick={() => open('appearance')}
    >
      <Palette size={20} strokeWidth={1.8} aria-hidden="true" />
      Appearance
    </button>

    <button
      type="button"
      class={item}
      aria-label={settings.resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={settings.resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      data-testid="sidebar-theme"
      onclick={toggleTheme}
    >
      {#if settings.resolvedTheme === 'dark'}
        <Sun size={20} strokeWidth={1.8} aria-hidden="true" />
        Light
      {:else}
        <Moon size={20} strokeWidth={1.8} aria-hidden="true" />
        Dark
      {/if}
    </button>
  </div>
</aside>
