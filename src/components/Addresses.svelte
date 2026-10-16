<script lang="ts">
  import { Home } from '@lucide/svelte';
  import { db } from '$lib/db';
  import { addAddress, addressIsUsable, deleteAddress, formatAddress, listAddresses, setHomeAddress, type Address } from '$lib/repo/details';

  let { contactId }: { contactId: number } = $props();

  let addresses = $state<Address[]>([]);
  let draft = $state({ street: '', city: '', postalCode: '', country: '' });
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    addresses = await listAddresses(await db(), id);
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
    if (!addressIsUsable(draft)) return;
    await addAddress(await db(), contactId, draft);
    draft = { street: '', city: '', postalCode: '', country: '' };
    await reload(contactId);
  }
</script>

<section class="card" data-testid="addresses">
  <h3 class="section-title">Addresses</h3>

  {#if failure}<p class="error" data-testid="addresses-failure">{failure}</p>{/if}

  <form
    class="mt-3 grid gap-2 sm:grid-cols-2"
    data-testid="address-form"
    onsubmit={(event) => {
      event.preventDefault();
      void run(save);
    }}
  >
    <input class="input sm:col-span-2" data-testid="address-street" placeholder="Street" autocomplete="off" bind:value={draft.street} />
    <input class="input" data-testid="address-city" placeholder="City" autocomplete="off" bind:value={draft.city} />
    <input class="input" data-testid="address-postal-code" placeholder="Postal code" autocomplete="off" bind:value={draft.postalCode} />
    <input class="input sm:col-span-2" data-testid="address-country" placeholder="Country" autocomplete="off" bind:value={draft.country} />
    <button type="submit" class="btn btn-primary" data-testid="save-address">Add address</button>
  </form>

  {#if addresses.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="addresses-empty">No addresses yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="address-list">
      {#each addresses as address (address.id)}
        <li class="border-line flex items-center gap-3 border-t pt-2" data-testid="address" data-home={address.is_home === 1}>
          <button
            type="button"
            class="shrink-0"
            class:text-accent={address.is_home === 1}
            class:text-muted={address.is_home === 0}
            aria-pressed={address.is_home === 1}
            aria-label={address.is_home === 1 ? `${formatAddress(address)} is the home address` : `Make this the home address`}
            data-testid="home-address"
            onclick={() => run(async () => {
              await setHomeAddress(await db(), contactId, address.id);
              await reload(contactId);
            })}
          >
            <Home class="size-4" fill={address.is_home === 1 ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          <span class="flex-1 text-sm" data-testid="address-text">{formatAddress(address)}</span>
          {#if address.is_home === 1}
            <span class="text-xs text-muted" data-testid="home-address-label">Home</span>
          {/if}
          <button type="button" class="btn btn-danger shrink-0" data-testid="delete-address" onclick={() => run(async () => {
              await deleteAddress(await db(), address.id);
              await reload(contactId);
            })}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>