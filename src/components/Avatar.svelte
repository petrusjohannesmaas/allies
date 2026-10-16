<script lang="ts">
  import { IMAGE_EXTENSIONS, pictureStore, pictureUrl } from '$lib/repo/pictures';

  let {
    picture,
    name,
    size = 48,
  }: { picture: string | null; name: string; size?: number } = $props();

  let url = $state<string | null>(null);

  const initials = $derived(
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join(''),
  );

  // The bytes come from the app's own folder and are shown through a blob URL,
  // so the asset protocol stays off. Every URL is handed back when it is
  // replaced or the avatar goes away.
  $effect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    if (!picture) {
      url = null;
      return;
    }

    pictureStore
      .read(picture)
      .then((bytes) => {
        if (cancelled) return;
        objectUrl = pictureUrl(bytes, IMAGE_EXTENSIONS[picture.split('.').pop() ?? ''] ?? 'application/octet-stream');
        url = objectUrl;
      })
      .catch(() => {
        url = null;
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  });
</script>

{#if url}
  <img src={url} alt={name} class="rounded-full object-cover" style="width: {size}px; height: {size}px" data-testid="avatar-picture" />
{:else}
  <span
    class="bg-accent/15 text-accent flex items-center justify-center rounded-full text-sm font-semibold"
    style="width: {size}px; height: {size}px"
    data-testid="avatar-initials"
    aria-hidden="true"
  >
    {initials || '?'}
  </span>
{/if}