<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import Avatar from '../components/Avatar.svelte';
  import ContactForm from '../components/ContactForm.svelte';
  import { labelFor } from '../lib/categories';
  import { db } from '../lib/db';
  import { openContact } from '../lib/navigation.svelte';
  import {
    addContactWithPicture,
    fullName,
    listContacts,
    type Contact,
    type ContactFormResult,
  } from '../lib/repo/contacts';

  let contacts = $state<Contact[]>([]);
  let mode = $state<'list' | 'add'>('list');
  let failure = $state('');

  $effect(() => {
    void reload();
  });

  async function reload() {
    contacts = await listContacts(await db());
  }

  async function save({ input, picture }: ContactFormResult) {
    const connection = await db();
    await addContactWithPicture(connection, input, picture);
    mode = 'list';
    await reload();
  }

  /** A failure in the database must say so rather than silently do nothing. */
  async function run(action: () => Promise<void>) {
    failure = '';
    try {
      await action();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<section class="p-6" data-testid="screen-contacts">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-lg font-semibold">All contacts</h2>
    {#if mode === 'list'}
      <Button data-testid="add-contact" onclick={() => (mode = 'add')}><Plus aria-hidden="true" />New contact</Button>
    {/if}
  </div>

  {#if failure}
    <p class="error mb-3" data-testid="contacts-failure">{failure}</p>
  {/if}

  {#if mode === 'add'}
    <div class="mb-4 max-w-sm">
      {#key 'add'}
        <ContactForm onsave={(input) => run(() => save(input))} oncancel={() => (mode = 'list')} />
      {/key}
    </div>
  {/if}

  {#if contacts.length === 0}
    <p class="text-sm text-muted-foreground" data-testid="contacts-empty">No contacts yet. Add the first one.</p>
  {:else}
    <ul class="grid gap-2" data-testid="contacts-list">
      {#each contacts as contact (contact.id)}
        <li data-testid="contact-row" data-contact-name={fullName(contact)}>
         <Card.Root class="flex-row items-center gap-3 px-4 py-3">
          <button
            type="button"
            class="hover:bg-accent -m-1 flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-1 text-left transition-colors"
            data-testid="open-contact"
            onclick={() => openContact(contact.id)}
          >
            <Avatar picture={contact.picture} name={fullName(contact)} size={40} />
            <span class="min-w-0">
              <span class="block truncate text-sm font-medium">{fullName(contact)}</span>
              <span class="block text-xs text-muted-foreground">{labelFor(contact.category)}</span>
            </span>
          </button>

         </Card.Root>
        </li>
      {/each}
    </ul>
  {/if}
</section>