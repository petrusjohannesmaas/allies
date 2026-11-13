<script lang="ts">
  import IconButton from './IconButton.svelte';
  import { Plus, Trash2 } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import EditableCard from './EditableCard.svelte';
  import { db } from '$lib/db';
  import { formatDate, today } from '$lib/dates';
  import { addCall, deleteCall, lastCalled, listCalls, type Call } from '$lib/repo/calls';

  let { contactId }: { contactId: number } = $props();

  let calls = $state<Call[]>([]);
  let last = $state<string | null>(null);
  let calledOn = $state(today());
  let description = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    const connection = await db();
    calls = await listCalls(connection, id);
    last = await lastCalled(connection, id);
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
    if (calledOn === '' || description.trim() === '') return;
    await addCall(await db(), contactId, calledOn, description);
    description = '';
    calledOn = today();
    await reload(contactId);
  }
</script>

<EditableCard label="phone calls" title="Phone calls" testid="calls">
  {#snippet view()}
    <p class="mt-1 text-sm text-muted-foreground" data-testid="last-called">Last called: {last === null ? 'never' : formatDate(last)}</p>
    {@render list(false)}
  {/snippet}

  {#snippet edit()}
    <p class="mt-1 text-sm text-muted-foreground" data-testid="last-called">Last called: {last === null ? 'never' : formatDate(last)}</p>

    {#if failure}<p class="error" data-testid="calls-failure">{failure}</p>{/if}

    <form
      class="mt-3 flex gap-2"
      data-testid="call-form"
      onsubmit={(event) => {
        event.preventDefault();
        void run(save);
      }}
    >
      <Input class="w-40" type="date" data-testid="call-date" bind:value={calledOn} />
      <Input class="flex-1" data-testid="call-description" placeholder="Caught up about the conference" autocomplete="off" bind:value={description} />
      <Button type="submit" data-testid="save-call"><Plus aria-hidden="true" />Log call</Button>
    </form>

    {@render list(true)}
  {/snippet}
</EditableCard>

{#snippet list(editable: boolean)}
  {#if calls.length === 0}
    <p class="mt-3 text-sm text-muted-foreground" data-testid="calls-empty">No calls yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="call-list">
      {#each calls as call (call.id)}
        <li class="border-border flex items-center gap-3 border-t pt-2" data-testid="call" data-date={call.called_on}>
          <div class="min-w-0 flex-1">
            <p class="text-sm" data-testid="call-description-value">{call.description}</p>
            <p class="text-xs text-muted-foreground" data-testid="call-date-value">{formatDate(call.called_on)}</p>
          </div>
          {#if editable}
            <IconButton
              class="shrink-0 text-destructive hover:text-destructive"
              label="Delete this call"
              data-testid="delete-call"
              onclick={() => run(async () => {
                await deleteCall(await db(), call.id);
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
