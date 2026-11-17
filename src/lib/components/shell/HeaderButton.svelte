<script lang="ts">
  import type { Snippet } from 'svelte';
  import { headerButton } from './styles';

  // A round icon button for the home header. The app's special icon (ICN 1)
  // uses it, so all three icons on the right look alike. Text after the icon,
  // such as Zaimu's streak count, widens it into a pill. `dot` marks something
  // new, such as an unread notification.
  let {
    label,
    onclick,
    dot = false,
    testid,
    children,
  }: {
    label: string;
    onclick?: () => void;
    dot?: boolean;
    testid?: string;
    children: Snippet;
  } = $props();
</script>

<button type="button" aria-label={label} title={label} data-testid={testid} {onclick} class="relative {headerButton}">
  {@render children()}
  {#if dot}
    <span
      class="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-(color:--accent-bg) ring-2 ring-background"
      data-testid={testid ? `${testid}-dot` : undefined}
      aria-hidden="true"
    ></span>
  {/if}
</button>
