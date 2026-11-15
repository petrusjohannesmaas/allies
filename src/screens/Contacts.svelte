<script lang="ts">
  import { Plus, Trash2, X } from '@lucide/svelte';
  import IconButton from '../components/IconButton.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import Avatar from '../components/Avatar.svelte';
  import ContactForm from '../components/ContactForm.svelte';
  import { labelFor } from '../lib/categories';
  import { db } from '../lib/db';
  import { openContact } from '../lib/navigation.svelte';
  import {
    addContactWithPicture,
    deleteContact,
    fullName,
    listContacts,
    type Contact,
    type ContactFormResult,
  } from '../lib/repo/contacts';

  let contacts = $state<Contact[]>([]);
  let mode = $state<'list' | 'add'>('list');
  // The id of the contact whose delete button is showing its confirmation.
  let confirming = $state<number | null>(null);
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

  async function remove(id: number) {
    const contact = contacts.find((candidate) => candidate.id === id);
    if (!contact) return;
    await deleteContact(await db(), contact);
    confirming = null;
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
    <h1 class="text-xl font-semibold">Contacts</h1>
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

          {#if confirming === contact.id}
            <span class="text-sm">Delete {fullName(contact)}?</span>
            <Button variant="destructive" data-testid="confirm-delete" onclick={() => run(() => remove(contact.id))}><Trash2 aria-hidden="true" />Delete</Button>
            <Button variant="outline" data-testid="cancel-delete" onclick={() => (confirming = null)}><X aria-hidden="true" />Cancel</Button>
          {:else}
            <IconButton
              class="text-destructive hover:text-destructive"
              label="Delete {fullName(contact)}"
              data-testid="delete-contact"
              onclick={() => (confirming = contact.id)}
            >
              <Trash2 aria-hidden="true" />
            </IconButton>
          {/if}
         </Card.Root>
        </li>
      {/each}
    </ul>
  {/if}
</section>