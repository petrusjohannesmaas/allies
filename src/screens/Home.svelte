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
  import { home, homeView } from '../lib/home.svelte';
  import { openContact } from '../lib/navigation.svelte';
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

  // A height of 0 means the list is not laid out yet, so every row shows until it is.
  // The list's measured height sets how many rows a page holds. The page the
  // arrows asked for is kept until the height changes or the contact is added,
  // and null means the page that holds the panel's contact.
  let listHeight = $state(0);
  let requestedPage = $state<number | null>(null);

  const view = $derived(homeView(contacts, home.selectedId, { listHeight: listHeight || Infinity, page: requestedPage }));
  const selectedId = $derived(view.selected?.id ?? null);

  $effect(() => {
    void reload();
  });

  $effect(() => {
    void listHeight;
    requestedPage = null;
  });

  // The panel's contact is remembered, so another screen and a sidebar click
  // bring Home back to it.
  // Before the list loads nothing is selected, and that must not wipe the memory.
  $effect(() => {
    if (loaded && selectedId !== null) home.selectedId = selectedId;
  });

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
      mode = 'list';
      requestedPage = null;
      await reload();
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
          rows={view.rows}
          total={contacts.length}
          {selectedId}
          {now}
          page={view.page}
          pages={view.pages}
          bind:listHeight
          onpage={(next) => (requestedPage = next)}
          onselect={(id) => (home.selectedId = id)}
          onadd={() => (mode = 'add')}
        />
      {/if}
      <ContactPanel {card} onopen={() => selectedId !== null && openContact(selectedId)} />
    </div>
  {/if}
</div>
