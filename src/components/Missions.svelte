<script lang="ts">
  import { db } from '$lib/db';
  import { addMission, deleteMission, listMissions, missionIsUsable, type Mission } from '$lib/repo/missions';

  let { contactId }: { contactId: number } = $props();

  let missions = $state<Mission[]>([]);
  let description = $state('');
  let dueDate = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    missions = await listMissions(await db(), id);
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
    if (!missionIsUsable(description)) return;
    await addMission(await db(), contactId, description, dueDate);
    description = '';
    dueDate = '';
    await reload(contactId);
  }
</script>

<section class="card" data-testid="missions">
  <h3 class="section-title">Missions</h3>

  {#if failure}<p class="error" data-testid="missions-failure">{failure}</p>{/if}

  <form
    class="mt-3 flex gap-2"
    data-testid="mission-form"
    onsubmit={(event) => {
      event.preventDefault();
      void run(save);
    }}
  >
    <input class="input" data-testid="mission-description" placeholder="Send the photos" autocomplete="off" bind:value={description} />
    <input class="input w-40" type="date" data-testid="mission-due-date" bind:value={dueDate} />
    <button type="submit" class="btn btn-primary" data-testid="save-mission">Add</button>
  </form>

  {#if missions.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="missions-empty">No missions yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="mission-list">
      {#each missions as mission (mission.id)}
        <li class="border-line flex items-center gap-3 border-t pt-2" data-testid="mission">
          <div class="min-w-0 flex-1">
            <p class="text-sm" data-testid="mission-text">{mission.description}</p>
            <p class="text-xs text-muted" data-testid="mission-due">
              {#if mission.due_date}Due {mission.due_date}{:else}No due date{/if}
            </p>
          </div>
          <button type="button" class="btn btn-danger shrink-0" data-testid="delete-mission" onclick={() => run(async () => {
              await deleteMission(await db(), mission.id);
              await reload(contactId);
            })}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>