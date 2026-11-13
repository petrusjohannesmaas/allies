<script lang="ts">
  import { Label } from '$lib/components/ui/label';
  import { Save, X } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
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
  <Label class="grid gap-1 text-sm">
    Description
    <Input data-testid="mission-details-description" autocomplete="off" bind:value={description} />
  </Label>
  <Label class="grid gap-1 text-sm">
    Due date
    <Input type="date" data-testid="mission-details-due" bind:value={due} />
  </Label>
  <div class="flex gap-2">
    {#if changed && hasText(description)}
      <Button type="submit" data-testid="save-mission-details"><Save aria-hidden="true" />Save</Button>
    {/if}
    <Button variant="outline" data-testid="cancel-mission-details" onclick={oncancel}><X aria-hidden="true" />Cancel</Button>
  </div>
</form>
