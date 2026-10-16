<script lang="ts">
  import DayRating from '../components/DayRating.svelte';
  import JournalRow from '../components/JournalRow.svelte';
  import { db } from '$lib/db';
  import { formatMonth, monthOf, today } from '$lib/dates';
  import { addEntry, deleteEntry, listJournal, type JournalRow as Row } from '$lib/repo/journal';

  let rows = $state<Row[]>([]);
  let entryDate = $state(today());
  let body = $state('');
  let failure = $state('');

  $effect(() => {
    void reload();
  });

  async function reload() {
    rows = await listJournal(await db());
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
    if (body.trim() === '') return;
    await addEntry(await db(), entryDate, body);
    body = '';
    entryDate = today();
    await reload();
  }

  async function remove(id: number) {
    await deleteEntry(await db(), id);
    await reload();
  }
</script>

<section class="p-6" data-testid="screen-journal">
  <h1 class="text-xl font-semibold">Journal</h1>
  <p class="mt-2 text-sm text-muted">Your days, newest first.</p>

  <div class="mt-4 grid gap-4">
    <DayRating day={today()} />

    <section class="card">
      <h2 class="section-title">Add a journal entry</h2>

      {#if failure}<p class="error mt-2" data-testid="journal-failure">{failure}</p>{/if}

      <form
        class="mt-3 flex gap-2"
        data-testid="journal-form"
        onsubmit={(event) => {
          event.preventDefault();
          void run(save);
        }}
      >
        <input class="input w-40" type="date" data-testid="entry-date" bind:value={entryDate} />
        <textarea class="input flex-1" rows="2" data-testid="entry-body" placeholder="How was your day?" bind:value={body}></textarea>
        <button type="submit" class="btn btn-primary" data-testid="save-entry">Add</button>
      </form>
    </section>

    {#if rows.length === 0}
      <p class="text-sm text-muted" data-testid="journal-empty">Nothing in the journal yet.</p>
    {:else}
      <ul class="card" data-testid="journal-list">
        {#each rows as row, index (row.kind + row.day + (row.source_id ?? ''))}
          {#if index === 0 || monthOf(rows[index - 1].day) !== monthOf(row.day)}
            <li class="text-sm font-semibold" data-testid="journal-month">{formatMonth(monthOf(row.day))}</li>
          {/if}
          <JournalRow {row} onDelete={row.kind === 'entry' && row.source_id !== null ? () => run(() => remove(row.source_id!)) : undefined} />
        {/each}
      </ul>
    {/if}
  </div>
</section>
