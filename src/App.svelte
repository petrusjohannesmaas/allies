<script lang="ts">
  import Sidebar from './components/Sidebar.svelte';
  import { navigation } from './lib/navigation.svelte';
  import { settings } from './lib/settings.svelte';
  import Appearance from './screens/Appearance.svelte';
  import Contact from './screens/Contact.svelte';
  import Contacts from './screens/Contacts.svelte';
  import Dashboard from './screens/Dashboard.svelte';
  import Journal from './screens/Journal.svelte';
  import Mission from './screens/Mission.svelte';
</script>

<!-- The search box stays on every screen, at the top of the sidebar, so a
     contact is always one keystroke away from wherever the user is. -->
<div class="flex h-screen w-screen overflow-hidden bg-[var(--accent-bg)]" data-testid="app-shell">
  <Sidebar />

  <main class="relative z-10 -ml-6 flex min-w-0 flex-1">
    <div class="@container h-full w-full overflow-y-auto rounded-l-[28px] bg-background shadow-xl" data-testid="content-panel">
      {#if settings.loadError}
        <p class="m-4 text-sm text-destructive" role="alert" data-testid="settings-load-error">
          {settings.loadError}
        </p>
      {/if}

      <div data-testid="open-screen">
        {#if navigation.screen === 'dashboard'}
          <Dashboard />
        {:else if navigation.screen === 'contacts'}
          <Contacts />
        {:else if navigation.screen === 'contact'}
          <Contact />
        {:else if navigation.screen === 'mission'}
          <Mission />
        {:else if navigation.screen === 'appearance'}
          <Appearance />
        {:else}
          <Journal />
        {/if}
      </div>
    </div>
  </main>
</div>
