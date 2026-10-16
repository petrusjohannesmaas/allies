<script lang="ts">
  import { Star } from '@lucide/svelte';
  import { db } from '$lib/db';
  import { addNote, deleteNote, listNotes, noteBodyIsUsable, setNoteFavourite, updateNote, type Note } from '$lib/repo/notes';

  let { contactId }: { contactId: number } = $props();

  let notes = $state<Note[]>([]);
  let draft = $state('');
  let editing = $state<number | null>(null);
  let editDraft = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    notes = await listNotes(await db(), id);
  }

  async function run(action: () => Promise<void>) {
    failure = '';
    try {
      await action();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }

  async function save(id: number) {
    if (!noteBodyIsUsable(editDraft)) return;
    await updateNote(await db(), id, editDraft);
    editing = null;
    editDraft = '';
    await reload(contactId);
  }

  async function toggle(note: Note) {
    await setNoteFavourite(await db(), note.id, note.is_favourite === 0);
    await reload(contactId);
  }
</script>

<section class="card" data-testid="notes">
  <h3 class="section-title">Notes</h3>

  {#if failure}<p class="error" data-testid="notes-failure">{failure}</p>{/if}

  <form
    class="mt-3 flex gap-2"
    data-testid="note-form"
    onsubmit={(event) => {
      event.preventDefault();
      if (!noteBodyIsUsable(draft)) return;
      void run(async () => {
        await addNote(await db(), contactId, draft);
        draft = '';
        await reload(contactId);
      });
    }}
  >
    <input
      class="input"
      data-testid="note-body"
      placeholder="What is worth remembering"
      autocomplete="off"
      bind:value={draft}
    />
    <button type="submit" class="btn btn-primary" data-testid="save-note">Save note</button>
  </form>

  {#if notes.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="notes-empty">No notes yet.</p>
  {:else}
    <ul class="mt-3 grid gap-2" data-testid="note-list">
      {#each notes as note (note.id)}
        <li class="border-line flex items-start gap-2 border-t pt-2" data-testid="note" data-favourite={note.is_favourite === 1}>
          <button
            type="button"
            class="mt-0.5 shrink-0"
            class:text-accent={note.is_favourite === 1}
            class:text-muted={note.is_favourite === 0}
            aria-pressed={note.is_favourite === 1}
            aria-label={note.is_favourite === 1 ? `Remove the favourite mark from this note` : `Mark this note as a favourite`}
            data-testid="favourite-note"
            onclick={() => run(() => toggle(note))}
          >
            <Star class="size-4" fill={note.is_favourite === 1 ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>

          <div class="min-w-0 flex-1">
            {#if editing === note.id}
              <div class="flex gap-2">
                <input class="input" data-testid="edit-note-body" autocomplete="off" bind:value={editDraft} />
                <button type="button" class="btn btn-primary" data-testid="save-edited-note" onclick={() => run(() => save(note.id))}>
                  Save
                </button>
                <button type="button" class="btn" data-testid="cancel-edit-note" onclick={() => (editing = null)}>Cancel</button>
              </div>
            {:else}
              <p class="text-sm whitespace-pre-wrap" data-testid="note-text">{note.body}</p>
            {/if}
          </div>

          {#if editing !== note.id}
            <button
              type="button"
              class="btn shrink-0"
              data-testid="edit-note"
              onclick={() => {
                editing = note.id;
                editDraft = note.body;
              }}
            >
              Edit
            </button>
          {/if}
          <button type="button" class="btn btn-danger shrink-0" data-testid="delete-note" onclick={() => run(async () => {
              await deleteNote(await db(), note.id);
              await reload(contactId);
            })}>
            Delete
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>