<script lang="ts">
  import { openContact } from '$lib/navigation.svelte';
  import { db } from '$lib/db';
  import { fullName, listContacts, type Contact } from '$lib/repo/contacts';
  import { getSignificantOther, setSignificantOther, type Child } from '$lib/repo/details';

  let { contactId }: { contactId: number } = $props();

  let partner = $state<Child | null>(null);
  let choices = $state<Contact[]>([]);
  let chosen = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    const connection = await db();
    partner = await getSignificantOther(connection, id);
    // A contact cannot be its own significant other, so it is not offered.
    choices = (await listContacts(connection)).filter((contact) => contact.id !== id);
  }

  async function run(action: () => Promise<void>) {
    failure = '';
    try {
      await action();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }

  async function choose(id: string) {
    await setSignificantOther(await db(), contactId, id === '' ? null : Number(id));
    chosen = '';
    await reload(contactId);
  }
</script>

<section class="card" data-testid="significant-other">
  <h3 class="section-title">Significant other</h3>

  {#if failure}<p class="error" data-testid="significant-other-failure">{failure}</p>{/if}

  {#if partner}
    <div class="mt-3 flex items-center gap-3">
      <button type="button" class="btn" data-testid="open-partner" onclick={() => openContact(partner!.id)}>
        {fullName(partner)}
      </button>
      <button type="button" class="btn btn-danger" data-testid="remove-partner" onclick={() => run(() => choose(''))}>
        Remove
      </button>
    </div>
  {:else}
    <p class="mt-3 text-sm text-muted" data-testid="significant-other-empty">No significant other yet.</p>
  {/if}

  {#if choices.length > 0}
    <label class="mt-3 block">
      <span class="field-label">{partner ? 'Change it to' : 'Set a significant other'}</span>
      <select class="input" data-testid="partner-picker" bind:value={chosen} onchange={() => run(() => choose(chosen))}>
        <option value="">{partner ? 'Choose a contact' : 'Choose a contact'}</option>
        {#each choices as contact (contact.id)}
          <option value={String(contact.id)}>{fullName(contact)}</option>
        {/each}
      </select>
    </label>
  {/if}
</section>