<script lang="ts">
  import { Pencil } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  let {
    label,
    title = '',
    testid,
    view,
    edit,
  }: {
    /** What the pencil edits, for the screen reader: "Edit contact details". */
    label: string;
    title?: string;
    testid?: string;
    view: Snippet;
    /** The editor. It gets `close`, which leaves edit mode and drops the draft. */
    edit: Snippet<[() => void]>;
  } = $props();

  // The editor exists only while editing, so closing the card, or leaving the
  // page, unmounts it and the draft goes with it.
  let editing = $state(false);

  function close() {
    editing = false;
  }
</script>

<!-- Escape from any field inside the card closes it. The card is not itself a control. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_static_element_interactions -->
<section
  class="card relative"
  data-testid={testid}
  onkeydown={(event) => {
    if (event.key === 'Escape' && editing) close();
  }}
>
  <button
    type="button"
    class="btn absolute right-3 top-3"
    aria-label={editing ? `Discard changes to ${label}` : `Edit ${label}`}
    data-testid="edit-card"
    onclick={() => (editing = !editing)}
  >
    <Pencil class="size-4" aria-hidden="true" />
  </button>

  {#if title}<h3 class="section-title pr-12">{title}</h3>{/if}

  {#if editing}
    {@render edit(close)}
  {:else}
    {@render view()}
  {/if}
</section>
