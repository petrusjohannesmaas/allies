<script lang="ts">
  import { Bell } from '@lucide/svelte';
  import { HeaderButton, HomeHeader } from '$lib/components/shell';
  import { openSettings } from '$lib/navigation.svelte';
  import { settings } from '$lib/settings.svelte';
  import ContactForm from '../components/ContactForm.svelte';
  import ContactList from '../components/ContactList.svelte';
  import ContactPanel from '../components/ContactPanel.svelte';
  import SearchBox from '../components/SearchBox.svelte';
  import { db } from '../lib/db';
  import { home } from '../lib/home.svelte';
  import {
    addContactWithPicture,
    getContactCard,
    listContactsByLastViewed,
    type Contact,
    type ContactCard,
    type ContactFormResult,
  } from '../lib/repo/contacts';

  // Home is the contact list beside a panel that always shows one contact,
  // under the shared header. The bell does nothing yet, and Allies has no
  // profile yet, so the menu offers to add one.
  let contacts = $state<Contact[]>([]);
  let loaded = $state(false);
  let now = $state(new Date());
  let card = $state<ContactCard | null>(null);
  let mode = $state<'list' | 'add'>('list');
  let failure = $state('');

  const selectedId = $derived(home.selectedId);

  $effect(() => {
    void reload();
  });

  // The panel's card follows the remembered contact. The list reports the
  // contact it shows, including a fresh random pick.
  $effect(() => {
    const id = selectedId;
    if (id === null) {
      card = null;
      return;
    }
    void (async () => {
      const found = await getContactCard(await db(), id);
      if (id === selectedId) card = found;
    })();
  });

  async function reload() {
    const found = await listContactsByLastViewed(await db());
    now = new Date();
    contacts = found;
    loaded = true;
  }

  async function save({ input, picture }: ContactFormResult) {
    failure = '';
    try {
      home.selectedId = await addContactWithPicture(await db(), input, picture);
      await reload();
      mode = 'list';
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }

  function toggleTheme() {
    void settings.setTheme(settings.resolvedTheme === 'dark' ? 'light' : 'dark');
  }
</script>

<div class="flex h-full min-h-0 flex-col px-6 pt-6 pb-6" data-testid="screen-home">
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

  {#if loaded}
    <div class="mt-4 flex min-h-0 flex-1 gap-4">
      {#if mode === 'add'}
        <div class="min-w-0 flex-1">
          {#if failure}
            <p class="mb-3 text-sm text-destructive" role="alert" data-testid="contacts-failure">{failure}</p>
          {/if}
          <div class="max-w-sm">
            <ContactForm onsave={save} oncancel={() => (mode = 'list')} />
          </div>
        </div>
      {:else}
        <ContactList
          {contacts}
          {selectedId}
          {now}
          onselect={(id) => (home.selectedId = id)}
          onadd={() => (mode = 'add')}
        />
      {/if}
      <ContactPanel {card} />
    </div>
  {/if}
</div>
