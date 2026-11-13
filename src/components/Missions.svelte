<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Plus } from '@lucide/svelte';
  import { db } from '$lib/db';
  import { openMission } from '$lib/navigation.svelte';
  import { addMission, listMissions, hasText, type Mission } from '$lib/repo/missions';

  let { contactId }: { contactId: number } = $props();

  let missions = $state<Mission[]>([]);
  let description = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    missions = await listMissions(await db(), id);
  }

  async function save() {
    failure = '';
    if (!hasText(description)) return;
    try {
      await addMission(await db(), contactId, description, '');
      description = '';
      await reload(contactId);
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<section class="min-w-0 md:ml-auto md:w-80" data-testid="missions">
  <h3 class="section-title">Missions</h3>

  {#if failure}<p class="error" data-testid="missions-failure">{failure}</p>{/if}

  {#if missions.length === 0}
    <p class="mt-2 text-sm text-muted-foreground" data-testid="missions-empty">No missions yet.</p>
  {:else}
    <ul class="mt-2 grid gap-1" data-testid="mission-list">
      {#each missions as mission (mission.id)}
        <li data-testid="mission">
          <button
            type="button"
            class="border-border hover:bg-accent flex w-full cursor-pointer items-center gap-3 rounded-lg border px-2 py-1 text-left transition-colors"
            data-testid="open-mission"
            onclick={() => openMission(contactId, mission.id)}
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm" data-testid="mission-text">{mission.description}</span>
              <span class="block text-xs text-muted-foreground" data-testid="mission-due">
                {#if mission.due_date}Due {mission.due_date}{:else}No due date{/if}
              </span>
            </span>
            <span class="shrink-0 text-xs text-muted-foreground" data-testid="mission-progress">{mission.done} of {mission.total}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <form
    class="mt-2 flex gap-2"
    data-testid="mission-form"
    onsubmit={(event) => {
      event.preventDefault();
      void save();
    }}
  >
    <Input data-testid="mission-description" placeholder="Send the photos" aria-label="New mission" autocomplete="off" bind:value={description} />
    <Button type="submit" data-testid="add-mission"><Plus aria-hidden="true" />Add mission</Button>
  </form>
</section>
