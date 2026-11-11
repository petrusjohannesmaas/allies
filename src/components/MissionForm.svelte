<script lang="ts">
  import { hasText, type Mission } from '$lib/repo/missions';

  let {
    mission,
    onsave,
    oncancel,
  }: {
    mission: Mission;
    onsave: (description: string, dueDate: string) => void | Promise<void>;
    oncancel: () => void;
  } = $props();

  // The form lives only while the card is in edit mode, so the draft starts
  // from the saved values each time the pencil opens it.
  function initial() {
    return { description: mission.description, due: mission.due_date ?? '' };
  }

  const saved = initial();
  let description = $state(initial().description);
  let due = $state(initial().due);

  const changed = $derived(description.trim() !== saved.description || due.trim() !== saved.due);
</script>

<form
  class="grid gap-2 pr-12"
  data-testid="mission-details-form"
  onsubmit={(event) => {
    event.preventDefault();
    if (!hasText(description)) return;
    void onsave(description, due);
  }}
>
  <label class="grid gap-1 text-sm">
    Description
    <input class="input" data-testid="mission-details-description" autocomplete="off" bind:value={description} />
  </label>
  <label class="grid gap-1 text-sm">
    Due date
    <input class="input" type="date" data-testid="mission-details-due" bind:value={due} />
  </label>
  <div class="flex gap-2">
    {#if changed && hasText(description)}
      <button type="submit" class="btn btn-primary" data-testid="save-mission-details">Save</button>
    {/if}
    <button type="button" class="btn" data-testid="cancel-mission-details" onclick={oncancel}>Cancel</button>
  </div>
</form>
