<script lang="ts">
  import { db } from '$lib/db';
  import { formatDate, today } from '$lib/dates';
  import { addReminder, deleteReminder, listReminders, type Reminder } from '$lib/repo/reminders';

  let { contactId }: { contactId: number } = $props();

  let reminders = $state<Reminder[]>([]);
  let remindOn = $state(today());
  let description = $state('');
  let repeats = $state(false);
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    reminders = await listReminders(await db(), id);
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
    if (remindOn === '' || description.trim() === '') return;
    await addReminder(await db(), contactId, remindOn, description, repeats);
    description = '';
    remindOn = today();
    repeats = false;
    await reload(contactId);
  }
</script>

<section class="card" data-testid="reminders">
  <h3 class="section-title">Reminders</h3>

  {#if failure}<p class="error" data-testid="reminders-failure">{failure}</p>{/if}

  <form
    class="mt-3 flex flex-wrap gap-2"
    data-testid="reminder-form"
    onsubmit={(event) => {
      event.preventDefault();
      void run(save);
    }}
  >
    <input class="input w-40" type="date" data-testid="reminder-date" bind:value={remindOn} />
    <input class="input flex-1" data-testid="reminder-description" placeholder="Send the photos" autocomplete="off" bind:value={description} />
    <label class="field-label flex items-center gap-2">
      <input type="checkbox" data-testid="reminder-repeats" bind:checked={repeats} />
      Every year
    </label>
    <button type="submit" class="btn btn-primary" data-testid="save-reminder">Add</button>
  </form>

  {#if reminders.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="reminders-empty">No reminders yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="reminder-list">
      {#each reminders as reminder (reminder.id)}
        <li class="border-line flex items-center gap-3 border-t pt-2" data-testid="reminder" data-date={reminder.remind_on}>
          <div class="min-w-0 flex-1">
            <p class="text-sm" data-testid="reminder-description-value">{reminder.description}</p>
            <p class="text-xs text-muted">
              <span data-testid="reminder-date-value">{formatDate(reminder.remind_on)}</span>
              <span data-testid="reminder-repeats-value">{reminder.repeats_yearly === 1 ? 'Every year' : 'Once'}</span>
            </p>
          </div>
          <button type="button" class="btn btn-danger shrink-0" data-testid="delete-reminder" onclick={() => run(async () => {
              await deleteReminder(await db(), reminder.id);
              await reload(contactId);
            })}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
