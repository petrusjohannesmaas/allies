<script lang="ts">
  // The CSP has no data: in img-src, so the logo must stay a file and not inline.
  import logo from './assets/logo.png?no-inline';
  import SearchBox from './components/SearchBox.svelte';
  import { navigation, open, screens } from './lib/navigation.svelte';
  import Contact from './screens/Contact.svelte';
  import Contacts from './screens/Contacts.svelte';
  import Dashboard from './screens/Dashboard.svelte';
  import Journal from './screens/Journal.svelte';
</script>

<!-- The search box stays on every screen, so a contact is always one keystroke
     away from wherever the user is. -->
<header class="flex items-center gap-3 border-b border-line bg-surface px-4 py-3" data-testid="top-bar">
  <img src={logo} alt="Allies" class="size-7 shrink-0" />

  <SearchBox />

  <nav class="flex gap-1" aria-label="Screens">
    {#each screens as item (item.screen)}
      <button
        type="button"
        class="btn"
        class:btn-primary={navigation.screen === item.screen}
        aria-current={navigation.screen === item.screen ? 'page' : undefined}
        onclick={() => open(item.screen)}
      >
        {item.label}
      </button>
    {/each}
  </nav>
</header>

<main data-testid="open-screen">
  {#if navigation.screen === 'dashboard'}
    <Dashboard />
  {:else if navigation.screen === 'contacts'}
    <Contacts />
  {:else if navigation.screen === 'contact'}
    <Contact />
  {:else}
    <Journal />
  {/if}
</main>