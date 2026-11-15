<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { Button, type ButtonVariant } from '$lib/components/ui/button';
  import * as Tooltip from '$lib/components/ui/tooltip';

  // A button that shows only an icon. The label is its accessible name and
  // its tooltip, so the two always match.
  let {
    label,
    variant = 'ghost',
    children,
    ...rest
  }: Omit<HTMLButtonAttributes, 'children'> & {
    label: string;
    variant?: ButtonVariant;
    children: Snippet;
  } = $props();
</script>

<Tooltip.Provider delayDuration={0}>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button {...props} {...rest as Record<string, unknown>} {variant} size="icon" aria-label={label}>
          {@render children()}
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>{label}</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
