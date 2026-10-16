<script lang="ts">
  import { openContact } from '$lib/navigation.svelte';
  import { db } from '$lib/db';
  import { fullName, listContacts, type Contact } from '$lib/repo/contacts';
import { addChild, listChildren, removeChild, type Child } from '$lib/repo/details';

  let { contactId }: { contactId: number } = $props();

  let children = $state<Child[]>([]);
  let choices = $state<Contact[]>([]);
  let chosen = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    const connection = await db();
    const listed = await listChildren(connection, id);
    children = listed;
    // A contact cannot be its own child, and cannot be added twice.
    const taken = new Set(listed.map((child) => child.id));
    choices = (await listContacts(connection)).filter((contact) => contact.id !== id && !taken.has(contact.id));
  }

  async function run(action: () => Promise<void>) {
    failure = '';
    try {
      await action();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }

  async function add() {
    if (chosen === '') return;
    await addChild(await db(), contactId, Number(chosen));
    chosen = '';
    await reload(contactId);
  }

  async function remove(childId: number) {
    await removeChild(await db(), contactId, childId);
    await reload(contactId);
  }
</script>

<section class="card" data-testid="children">
  <h3 class="section-title">Children</h3>

  {#if failure}<p class="error" data-testid="children-failure">{failure}</p>{/if}

  {#if children.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="children-empty">No children yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="child-list">
      {#each children as child (child.id)}
        <li class="border-line flex items-center gap-3 border-t pt-2" data-testid="child" data-child-name={fullName(child)}>
          <button type="button" class="btn flex-1 text-left" data-testid="open-child" onclick={() => openContact(child.id)}>
            {fullName(child)}
          </button>
          <button type="button" class="btn btn-danger shrink-0" data-testid="remove-child" onclick={() => run(() => remove(child.id))}>
            Remove
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if choices.length > 0}
    <label class="mt-3 block">
      <span class="field-label">Add a child from the contacts</span>
      <select class="input" data-testid="child-picker" bind:value={chosen}>
        <option value="">Choose a contact</option>
        {#each choices as contact (contact.id)}
          <option value={String(contact.id)}>{fullName(contact)}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn btn-primary mt-2" data-testid="save-child" onclick={() => run(add)}>Add child</button>
  {/if}
</section>