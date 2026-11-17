<script lang="ts">
  import { Construction } from '@lucide/svelte';

  // Stands in for a page or settings section that UI-UPDATES.md plans but
  // that is not built yet, so the sidebar and tabs can be checked first.
  let { title, note = 'Not built yet.' }: { title: string; note?: string } = $props();
</script>

<div
  class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-12 text-center"
  data-testid="placeholder"
>
  <Construction class="size-8 text-muted-foreground" aria-hidden="true" />
  <p class="font-medium">{title}</p>
  <p class="max-w-md text-sm text-muted-foreground">{note}</p>
</div>
