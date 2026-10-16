<script lang="ts">
  import { Frown, Meh, Smile } from '@lucide/svelte';
  import { formatDate } from '$lib/dates';
  import { openContact } from '$lib/navigation.svelte';
  import type { JournalRow } from '$lib/repo/journal';

  let { row, onDelete }: { row: JournalRow; onDelete?: () => void } = $props();

  const FACES = {
    1: { name: 'Sad', Icon: Frown },
    2: { name: 'Neutral', Icon: Meh },
    3: { name: 'Happy', Icon: Smile },
  } as const;

  const KIND_LABELS = { entry: 'Journal entry', rating: 'Rating', activity: 'Activity', call: 'Call' } as const;

  const face = $derived(row.face === null ? null : FACES[row.face as 1 | 2 | 3]);
</script>

<li
  class="border-line flex items-start gap-3 border-t py-3"
  data-testid="journal-row"
  data-kind={row.kind}
  data-day={row.day}
  data-source-id={row.source_id ?? ''}
>
  <div class="min-w-0 flex-1">
    <p class="text-xs text-muted" data-testid="journal-row-kind">{KIND_LABELS[row.kind]}</p>
    {#if face}
      <p class="mt-1 flex items-center gap-2 text-sm" data-testid="journal-row-body">
        You rated your day: {face.name}
        <face.Icon class="size-4" aria-hidden="true" />
      </p>
    {:else}
      <p class="mt-1 text-sm" data-testid="journal-row-body">{row.body}</p>
    {/if}
    <p class="mt-1 text-xs text-muted" data-testid="journal-row-date">{formatDate(row.day)}</p>
  </div>

  <span class="flex shrink-0 items-center gap-2 text-xs text-muted">
    {#if row.kind === 'entry' && onDelete}
      <button type="button" class="btn btn-danger" data-testid="delete-entry" onclick={onDelete}>Delete</button>
    {:else if row.kind === 'activity' || row.kind === 'call'}
      <span data-testid="journal-row-automatic">Created automatically</span>
      {#if row.contact_id !== null && row.contact_name}
        <button type="button" class="btn" data-testid="open-journal-contact" onclick={() => openContact(row.contact_id!)}>
          <span data-testid="journal-row-contact">with {row.contact_name}</span>
        </button>
      {/if}
    {/if}
  </span>
</li>
