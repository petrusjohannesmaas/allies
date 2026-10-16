<script lang="ts">
  import { X } from '@lucide/svelte';
  import { db } from '$lib/db';
  import { addTag, listTags, removeTag } from '$lib/repo/details';

  let { contactId }: { contactId: number } = $props();

  let tags = $state<string[]>([]);
  let draft = $state('');
  let failure = $state('');

  $effect(() => {
    void reload(contactId);
  });

  async function reload(id: number) {
    tags = await listTags(await db(), id);
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
    if (draft.trim() === '') return;
    await addTag(await db(), contactId, draft);
    draft = '';
    await reload(contactId);
  }

  async function remove(tag: string) {
    await removeTag(await db(), contactId, tag);
    await reload(contactId);
  }
</script>

<section class="card" data-testid="tags">
  <h3 class="section-title">Tags</h3>

  {#if failure}<p class="error" data-testid="tags-failure">{failure}</p>{/if}

  <form
    class="mt-3 flex gap-2"
    data-testid="tag-form"
    onsubmit={(event) => {
      event.preventDefault();
      void run(save);
    }}
  >
    <input class="input flex-1" data-testid="tag-input" placeholder="chess" autocomplete="off" bind:value={draft} />
    <button type="submit" class="btn btn-primary" data-testid="save-tag">Add</button>
  </form>

  {#if tags.length === 0}
    <p class="mt-3 text-sm text-muted" data-testid="tags-empty">No tags yet.</p>
  {:else}
    <ul class="mt-3 flex flex-wrap gap-2" data-testid="tag-list">
      {#each tags as tag (tag)}
        <li class="border-line bg-bg flex items-center gap-1 rounded-full border px-2 py-1 text-xs" data-testid="tag" data-tag={tag}>
          <span data-testid="tag-text">{tag}</span>
          <button type="button" class="text-muted hover:text-fg" aria-label={`Remove the tag ${tag}`} data-testid="remove-tag" onclick={() => run(() => remove(tag))}>
            <X class="size-3" aria-hidden="true" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>