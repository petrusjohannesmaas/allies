<script lang="ts">
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

<section class="card" data-testid="calls">
  <h3 class="section-title">Phone calls</h3>
  <p class="mt-1 text-sm text-muted" data-testid="last-called">Last called: {last === null ? 'never' : formatDate(last)}</p>

  {#if failure}<p class="error" data-testid="calls-failure">{failure}</p>{/if}

  <form
    class="mt-3 flex gap-2"
    data-testid="call-form"
    onsubmit={(event) => {
      event.preventDefault();
      void run(save);
    }}
  >
    <input class="input w-40" type="date" data-testid="call-date" bind:value={calledOn} />
    <input class="input flex-1" data-testid="call-description" placeholder="Caught up about the conference" autocomplete="off" bind:value={description} />
    <button type="submit" class="btn btn-primary" data-testid="save-call">Log call</button>
  </form>

  {#if calls.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="calls-empty">No calls yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="call-list">
      {#each calls as call (call.id)}
        <li class="border-line flex items-center gap-3 border-t pt-2" data-testid="call" data-date={call.called_on}>
          <div class="min-w-0 flex-1">
            <p class="text-sm" data-testid="call-description-value">{call.description}</p>
            <p class="text-xs text-muted" data-testid="call-date-value">{formatDate(call.called_on)}</p>
          </div>
          <button type="button" class="btn btn-danger shrink-0" data-testid="delete-call" onclick={() => run(async () => {
              await deleteCall(await db(), call.id);
              await reload(contactId);
            })}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
