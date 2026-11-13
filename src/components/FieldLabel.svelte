<script lang="ts">
  import type { Component, Snippet } from 'svelte';

  let {
    icon: Icon,
    as = 'dt',
    children,
  }: {
    /** A Lucide icon shown in front of the text. */
    icon?: Component<{ class?: string; 'aria-hidden'?: 'true' }>;
    /** `dt` inside a `dl` on a card, `span` inside a form's label. */
    as?: 'dt' | 'span';
    children: Snippet;
  } = $props();
</script>

<svelte:element this={as} class="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
  {#if Icon}<Icon class="size-3.5 shrink-0" aria-hidden="true" />{/if}
  {@render children()}
</svelte:element>
