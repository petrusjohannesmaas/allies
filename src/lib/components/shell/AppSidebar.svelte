<script lang="ts">
  import { LogOut, Settings } from '@lucide/svelte';
  import { Tooltip } from 'bits-ui';
  import ShellTooltip from './ShellTooltip.svelte';
  import { sidebarButton, sidebarButtonCurrent } from './styles';
  import type { NavItem } from './types';

  // Always collapsed: icons only, each labelled by a tooltip. From the top:
  // the logo, Home and the three features centred in the free space, then
  // Settings and the Log out button at the bottom. Log out is disabled until
  // the apps have accounts.
  let {
    logo,
    appName,
    home,
    features,
    current,
    onnavigate,
  }: {
    logo: string;
    appName: string;
    home: NavItem;
    features: [NavItem, NavItem, NavItem];
    current: string;
    onnavigate: (id: string) => void;
  } = $props();

  const pages = $derived([home, ...features]);
</script>

<!-- The content panel overlaps the sidebar by 24px (-ml-6 in AppShell). The
     extra width and right padding keep the logo and icons 24px from both the
     window edge and the panel. -->
<Tooltip.Provider delayDuration={150}>
  <aside
    class="z-0 flex w-30 shrink-0 flex-col items-center bg-secondary py-4 pr-6"
    aria-label="Main"
    data-testid="sidebar"
  >
    <img src={logo} alt={appName} class="size-12 shrink-0" data-testid="sidebar-logo" />

    <nav class="flex flex-1 flex-col justify-center gap-3" aria-label="Pages">
      {#each pages as item (item.id)}
        <ShellTooltip label={item.label}>
          {#snippet children(props)}
            <button
              {...props}
              type="button"
              aria-label={item.label}
              aria-current={current === item.id ? 'page' : undefined}
              data-testid="sidebar-{item.id}"
              onclick={() => onnavigate(item.id)}
              class="{sidebarButton} {current === item.id ? sidebarButtonCurrent : ''}"
            >
              <item.icon size={22} strokeWidth={1.8} aria-hidden="true" />
              {#if item.dot}
                <span
                  class="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-(color:--accent-bg) ring-2 ring-secondary"
                  data-testid="sidebar-{item.id}-dot"
                  aria-hidden="true"
                ></span>
              {/if}
            </button>
          {/snippet}
        </ShellTooltip>
      {/each}
    </nav>

    <div class="flex flex-col gap-3" data-testid="sidebar-footer">
      <ShellTooltip label="Settings">
        {#snippet children(props)}
          <button
            {...props}
            type="button"
            aria-label="Settings"
            aria-current={current === 'settings' ? 'page' : undefined}
            data-testid="sidebar-settings"
            onclick={() => onnavigate('settings')}
            class="{sidebarButton} {current === 'settings' ? sidebarButtonCurrent : ''}"
          >
            <Settings size={22} strokeWidth={1.8} aria-hidden="true" />
          </button>
        {/snippet}
      </ShellTooltip>

      <!-- aria-disabled rather than disabled, so the tooltip still explains it. -->
      <ShellTooltip label="Log out is not available yet">
        {#snippet children(props)}
          <button
            {...props}
            type="button"
            aria-label="Log out"
            aria-disabled="true"
            data-testid="sidebar-logout"
            class="flex size-12 cursor-not-allowed items-center justify-center rounded-2xl text-muted-foreground opacity-40"
          >
            <LogOut size={22} strokeWidth={1.8} aria-hidden="true" />
          </button>
        {/snippet}
      </ShellTooltip>
    </div>
  </aside>
</Tooltip.Provider>
