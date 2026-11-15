<script lang="ts">
  import { Pencil } from '@lucide/svelte';
  import type { Component, Snippet } from 'svelte';
  import IconButton from './IconButton.svelte';
  import * as Card from '$lib/components/ui/card';

  let {
    label,
    title = '',
    icon: Icon,
    testid,
    view,
    edit,
  }: {
    /** What the pencil edits, for the screen reader: "Edit contact details". */
    label: string;
    title?: string;
    /** A Lucide icon shown in front of the title. */
    icon?: Component<{ class?: string; 'aria-hidden'?: 'true' }>;
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
<Card.Root
  class="relative min-h-40 px-4"
  data-testid={testid}
  onkeydown={(event: KeyboardEvent) => {
    if (event.key === 'Escape' && editing) close();
  }}
>
  <IconButton
    class="absolute right-3 top-3"
    label={editing ? `Discard changes to ${label}` : `Edit ${label}`}
    data-testid="edit-card"
    onclick={() => (editing = !editing)}
  >
    <Pencil aria-hidden="true" />
  </IconButton>

  {#if title}
    <h3 class="flex items-center gap-2 pr-12 text-base font-semibold text-foreground">
      {#if Icon}<Icon class="size-4 shrink-0" aria-hidden="true" />{/if}
      {title}
    </h3>
  {/if}

  {#if editing}
    {@render edit(close)}
  {:else}
    {@render view()}
  {/if}
</Card.Root>
