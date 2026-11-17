<script lang="ts">
  import { Tooltip } from 'bits-ui';
  import type { Snippet } from 'svelte';

  // Wraps a trigger so its label shows beside it on hover and focus. The
  // trigger is rendered by the caller, which spreads `props` onto its button.
  let {
    label,
    side = 'right',
    children,
  }: {
    label: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    children: Snippet<[Record<string, unknown>]>;
  } = $props();
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      {@render children(props)}
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Portal>
    <Tooltip.Content
      {side}
      sideOffset={8}
      class="z-50 rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow-md"
    >
      {label}
    </Tooltip.Content>
  </Tooltip.Portal>
</Tooltip.Root>
