<script lang="ts">
  import { Bell } from '@lucide/svelte';
  import { HeaderButton, HomeHeader } from '$lib/components/shell';
  import { openSettings } from '$lib/navigation.svelte';
  import { settings } from '$lib/settings.svelte';
  import SearchBox from '../components/SearchBox.svelte';
  import Contacts from './Contacts.svelte';

  // Home is the contacts list under the shared header. The bell (ICN 1) does
  // nothing yet, and Allies has no profile yet, so the menu offers to add one.
  // UI-UPDATES.md plans both.
  function toggleTheme() {
    void settings.setTheme(settings.resolvedTheme === 'dark' ? 'light' : 'dark');
  }
</script>

<div class="px-6 pt-6" data-testid="screen-home">
  <HomeHeader
    dark={settings.resolvedTheme === 'dark'}
    ontoggletheme={toggleTheme}
    profile={{ name: '', subtitle: '', photoUrl: null }}
    onopenprofile={() => openSettings('profile')}
  >
    {#snippet special()}
      <HeaderButton label="Notifications" testid="notifications">
        <Bell size={20} strokeWidth={1.8} aria-hidden="true" />
      </HeaderButton>
    {/snippet}
    <div class="w-full max-w-md">
      <SearchBox />
    </div>
  </HomeHeader>
</div>
<Contacts />
