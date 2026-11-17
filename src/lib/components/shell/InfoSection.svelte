<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Attribution } from './types';

  // Settings, Info: the logo, what the app is, and the logo credit. Without
  // `onopenlink` the credit's address shows as text that can be selected,
  // because a plain link would navigate the app's own window away.
  let {
    logo,
    appName,
    description,
    attribution,
    onopenlink,
    children,
  }: {
    logo: string;
    appName: string;
    description: string;
    attribution: Attribution;
    onopenlink?: (url: string) => void;
    children?: Snippet;
  } = $props();
</script>

<div class="flex max-w-xl flex-col gap-6" data-testid="info-section">
  <div class="flex items-center gap-4">
    <img src={logo} alt="" class="size-16 shrink-0" />
    <div>
      <h2 class="text-xl font-semibold">{appName}</h2>
      <p class="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>

  {@render children?.()}

  <div class="flex flex-col gap-1" data-testid="logo-attribution">
    <h3 class="text-sm font-medium text-muted-foreground">Logo</h3>
    <p class="text-sm">{attribution.text}</p>
    {#if attribution.url}
      {#if onopenlink}
        <button
          type="button"
          class="w-fit cursor-pointer text-sm text-(color:--accent-text) underline-offset-4 hover:underline"
          onclick={() => onopenlink(attribution.url)}
        >
          {attribution.url}
        </button>
      {:else}
        <p class="text-sm text-muted-foreground select-text">{attribution.url}</p>
      {/if}
    {/if}
  </div>
</div>
