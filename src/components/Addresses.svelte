<script lang="ts">
  import IconButton from './IconButton.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { House, Plus, Trash2, MapPin } from '@lucide/svelte';
  import EditableCard from './EditableCard.svelte';
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

<EditableCard label="address" title="Address" icon={MapPin} testid="addresses">
  {#snippet view()}
    {@render list(false)}
  {/snippet}

  {#snippet edit()}
    {#if failure}<p class="error" data-testid="addresses-failure">{failure}</p>{/if}

    <form
      class="mt-3 grid gap-2 sm:grid-cols-2"
      data-testid="address-form"
      onsubmit={(event) => {
        event.preventDefault();
        void run(save);
      }}
    >
      <Input class="sm:col-span-2" data-testid="address-street" placeholder="Street" autocomplete="off" bind:value={draft.street} />
      <Input data-testid="address-city" placeholder="City" autocomplete="off" bind:value={draft.city} />
      <Input data-testid="address-postal-code" placeholder="Postal code" autocomplete="off" bind:value={draft.postalCode} />
      <Input class="sm:col-span-2" data-testid="address-country" placeholder="Country" autocomplete="off" bind:value={draft.country} />
      <Button type="submit" data-testid="save-address"><Plus aria-hidden="true" />Add address</Button>
    </form>

    {@render list(true)}
  {/snippet}
</EditableCard>

{#snippet list(editable: boolean)}
  {#if addresses.length === 0}
    <p class="mt-3 text-sm text-muted-foreground" data-testid="addresses-empty">No addresses yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="address-list">
      {#each addresses as address (address.id)}
        <li
          class="border-border flex items-center gap-3 border-t pt-2"
          data-testid="address"
          data-home={address.is_home === 1}
          data-street={address.street ?? ''}
        >
          {#if editable}
            <IconButton
              class="shrink-0 {address.is_home === 1 ? 'text-[var(--accent-text)]' : 'text-muted-foreground'}"
              aria-pressed={address.is_home === 1}
              label={address.is_home === 1 ? `${formatAddress(address)} is the home address` : `Make this the home address`}
              data-testid="home-address"
              onclick={() => run(async () => {
                await setHomeAddress(await db(), contactId, address.id);
                await reload(contactId);
              })}
            >
              <House fill={address.is_home === 1 ? 'currentColor' : 'none'} aria-hidden="true" />
            </IconButton>
          {/if}
          <span class="flex-1 text-sm" data-testid="address-text">{formatAddress(address)}</span>
          {#if address.is_home === 1}
            <span class="flex items-center gap-1 text-xs text-muted-foreground" data-testid="home-address-label"><House class="size-3.5" aria-hidden="true" />Home</span>
          {/if}
          {#if editable}
            <IconButton
              class="shrink-0 text-destructive hover:text-destructive"
              label="Delete this address"
              data-testid="delete-address"
              onclick={() => run(async () => {
                await deleteAddress(await db(), address.id);
                await reload(contactId);
              })}
            >
              <Trash2 aria-hidden="true" />
            </IconButton>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}
