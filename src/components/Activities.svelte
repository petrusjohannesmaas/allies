<script lang="ts">
  import { db } from '$lib/db';
  import { formatDate, today } from '$lib/dates';
  import { ACTIVITY_CATEGORIES } from '$lib/activity-categories';
  import { addActivity, deleteActivity, lastActivityTogether, listActivities, type Activity } from '$lib/repo/activities';

  let { contactId }: { contactId: number } = $props();

  let activities = $state<Activity[]>([]);
  let last = $state<string | null>(null);
  let happenedOn = $state(today());
  let category = $state<string>(ACTIVITY_CATEGORIES[0]);
  let description = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    const connection = await db();
    activities = await listActivities(connection, id);
    last = await lastActivityTogether(connection, id);
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
    if (happenedOn === '' || description.trim() === '') return;
    await addActivity(await db(), contactId, category, happenedOn, description);
    description = '';
    happenedOn = today();
    await reload(contactId);
  }
</script>

<section class="card" data-testid="activities">
  <h3 class="section-title">Activities</h3>
  <p class="mt-1 text-sm text-muted" data-testid="last-activity">Last activity together: {last === null ? 'never' : formatDate(last)}</p>

  {#if failure}<p class="error" data-testid="activities-failure">{failure}</p>{/if}

  <form
    class="mt-3 grid gap-2 sm:grid-cols-2"
    data-testid="activity-form"
    onsubmit={(event) => {
      event.preventDefault();
      void run(save);
    }}
  >
    <select class="input sm:col-span-2" data-testid="activity-category" bind:value={category}>
      {#each ACTIVITY_CATEGORIES as option (option)}
        <option value={option}>{option}</option>
      {/each}
    </select>
    <input class="input" type="date" data-testid="activity-date" bind:value={happenedOn} />
    <input class="input" data-testid="activity-description" placeholder="We went skiing" autocomplete="off" bind:value={description} />
    <button type="submit" class="btn btn-primary sm:col-span-2 justify-self-start" data-testid="save-activity">Log activity</button>
  </form>

  {#if activities.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="activities-empty">No activities yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="activity-list">
      {#each activities as activity (activity.id)}
        <li class="border-line flex items-center gap-3 border-t pt-2" data-testid="activity" data-date={activity.happened_on}>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-muted" data-testid="activity-category-value">{activity.category}</p>
            <p class="text-sm" data-testid="activity-description-value">{activity.description}</p>
            <p class="text-xs text-muted" data-testid="activity-date-value">{formatDate(activity.happened_on)}</p>
          </div>
          <button type="button" class="btn btn-danger shrink-0" data-testid="delete-activity" onclick={() => run(async () => {
              await deleteActivity(await db(), activity.id);
              await reload(contactId);
            })}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>
