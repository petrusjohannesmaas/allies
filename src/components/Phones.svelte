<script lang="ts">
  import { db } from '$lib/db';
  import { addPhone, deletePhone, listPhones, type Phone } from '$lib/repo/details';

  let { contactId }: { contactId: number } = $props();

  let phones = $state<Phone[]>([]);
  let label = $state('');
  let number = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

async function reload(id: number) {
  phones = await listPhones(await db(), id);
}

async function run(action: () => Promise<void>) {
  failure = '';
  try {
    await action();
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }
}

async function save() {
  if (label.trim() === '' || number.trim() === '') return;
  await addPhone(await db(), contactId, label, number);
  label = '';
  number = '';
  await reload(contactId);
}
</script>

<section class="card" data-testid="phones">
  <h3 class="section-title">Phone numbers</h3>

  {#if failure}<p class="error" data-testid="phones-failure">{failure}</p>{/if}

  <form
    class="mt-3 flex gap-2"
    data-testid="phone-form"
    onsubmit={(event) => {
      event.preventDefault();
      void run(save);
    }}
  >
    <input class="input w-32" data-testid="phone-label" placeholder="mobile" autocomplete="off" bind:value={label} />
    <input class="input flex-1" data-testid="phone-number" placeholder="082 123 4567" autocomplete="off" bind:value={number} />
    <button type="submit" class="btn btn-primary" data-testid="save-phone">Add</button>
  </form>

  {#if phones.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="phones-empty">No phone numbers yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="phone-list">
      {#each phones as phone (phone.id)}
        <li class="border-line flex items-center gap-3 border-t pt-2" data-testid="phone" data-label={phone.label}>
          <span class="text-xs text-muted" data-testid="phone-label-value">{phone.label}</span>
          <span class="flex-1 text-sm" data-testid="phone-number-value">{phone.number}</span>
          <button type="button" class="btn btn-danger shrink-0" data-testid="delete-phone" onclick={() => run(async () => {
              await deletePhone(await db(), phone.id);
              await reload(contactId);
            })}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>