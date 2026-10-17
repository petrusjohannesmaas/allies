<script lang="ts">
  import { Search } from '@lucide/svelte';
  import { db } from '$lib/db';
  import { openContact } from '$lib/navigation.svelte';
  import { fullName, searchContacts, type Contact } from '$lib/repo/contacts';

  let text = $state('');
  let results = $state<Contact[]>([]);
  let searched = $state(false);

  // Every keystroke runs a query, so an older query can answer after a newer
  // one. The count below keeps only the answers to the text as it is now.
  let asked = 0;

  async function search() {
    const query = text;
    const mine = ++asked;

    const found = await searchContacts(await db(), query);
    if (mine !== asked) return;

    results = found;
    searched = query.trim() !== '';
  }

  function choose(contact: Contact) {
    text = '';
    results = [];
    searched = false;
    openContact(contact.id);
  }

  function clear() {
    text = '';
    results = [];
    searched = false;
  }
</script>

<div class="relative flex-1">
  <Search class="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
  <input
    type="search"
    class="input pl-8"
    placeholder="Search contacts"
    aria-label="Search contacts"
    aria-controls="search-results"
    data-testid="search-box"
    bind:value={text}
    oninput={search}
  />

  {#if searched}
    <div
      id="search-results"
      class="border-line absolute top-full right-0 left-0 z-10 mt-1 max-h-80 overflow-auto rounded-[var(--radius)] border bg-surface shadow-lg"
      data-testid="search-results"
    >
      {#if results.length === 0}
        <p class="px-3 py-2 text-sm text-muted" data-testid="search-empty">No contacts found</p>
      {:else}
        <ul>
          {#each results as contact (contact.id)}
            <li>
              <button
                type="button"
                class="block w-full px-3 py-2 text-left text-sm hover:bg-bg"
                data-testid="search-result"
                data-contact-name={fullName(contact)}
                onclick={() => choose(contact)}
              >
                {fullName(contact)}
                <span class="text-xs text-muted">{contact.category}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<!-- The box keeps focus after a result opens, so the user can type the next
     name straight away. -->
<svelte:window onkeydown={(event) => event.key === 'Escape' && clear()} />