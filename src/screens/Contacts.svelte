<script lang="ts">
  import Avatar from '../components/Avatar.svelte';
  import ContactForm from '../components/ContactForm.svelte';
  import { db } from '../lib/db';
  import {
    addContactWithPicture,
    deleteContact,
    fullName,
    listContacts,
    updateContactWithPicture,
    type Contact,
    type ContactFormResult,
  } from '../lib/repo/contacts';

  let contacts = $state<Contact[]>([]);
  let mode = $state<'list' | 'add' | 'edit'>('list');
  let editing = $state<Contact | null>(null);
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
    if (mode === 'edit' && editing) {
      await updateContactWithPicture(connection, editing, input, picture);
    } else {
      await addContactWithPicture(connection, input, picture);
    }
    mode = 'list';
    editing = null;
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
      <button type="button" class="btn btn-primary" data-testid="add-contact" onclick={() => (mode = 'add')}>Add contact</button>
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
  {:else if mode === 'edit' && editing}
    <div class="mb-4 max-w-sm">
      {#key editing.id}
        <ContactForm
          contact={editing}
          onsave={(input) => run(() => save(input))}
          oncancel={() => {
            mode = 'list';
            editing = null;
          }}
        />
      {/key}
    </div>
  {/if}

  {#if contacts.length === 0}
    <p class="text-sm text-muted" data-testid="contacts-empty">No contacts yet. Add the first one.</p>
  {:else}
    <ul class="grid gap-2" data-testid="contacts-list">
      {#each contacts as contact (contact.id)}
        <li class="card flex items-center gap-3" data-testid="contact-row" data-contact-name={fullName(contact)}>
          <Avatar picture={contact.picture} name={fullName(contact)} size={40} />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{fullName(contact)}</p>
            <p class="text-xs text-muted">{contact.category}</p>
          </div>

          {#if confirming === contact.id}
            <span class="text-sm">Delete {fullName(contact)}?</span>
            <button type="button" class="btn btn-danger" data-testid="confirm-delete" onclick={() => run(() => remove(contact.id))}>
              Delete
            </button>
            <button type="button" class="btn" data-testid="cancel-delete" onclick={() => (confirming = null)}>Cancel</button>
          {:else}
            <button
              type="button"
              class="btn"
              data-testid="edit-contact"
              onclick={() => {
                editing = contact;
                mode = 'edit';
              }}
            >
              Edit
            </button>
            <button
              type="button"
              class="btn btn-danger"
              data-testid="delete-contact"
              onclick={() => (confirming = contact.id)}
            >
              Delete
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>