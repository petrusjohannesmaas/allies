<script lang="ts">
  import type { Snippet } from 'svelte';
  import AppSidebar from './AppSidebar.svelte';
  import type { NavItem } from './types';

  // The window frame every app shares: the grey sidebar on the left and the
  // content panel, whose two left corners curve over the sidebar. The panel
  // fills the window on the top, right and bottom edges.
  let {
    logo,
    appName,
    home,
    features,
    current,
    onnavigate,
    children,
  }: {
    logo: string;
    appName: string;
    home: NavItem;
    features: [NavItem, NavItem, NavItem];
    current: string;
    onnavigate: (id: string) => void;
    children: Snippet;
  } = $props();
</script>

<div class="flex h-screen w-screen overflow-hidden bg-secondary" data-testid="app-shell">
  <AppSidebar {logo} {appName} {home} {features} {current} {onnavigate} />
  <main class="relative z-10 -ml-6 flex min-w-0 flex-1">
    <div
      class="@container h-full w-full overflow-y-auto rounded-l-[28px] bg-background shadow-xl"
      data-testid="content-panel"
    >
      {@render children()}
    </div>
  </main>
</div>
