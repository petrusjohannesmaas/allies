<script lang="ts">
  import { ChevronDown, UserRound } from '@lucide/svelte';
  import { Popover } from 'bits-ui';
  import { initials } from './attribution';
  import type { ShellProfile } from './types';

  // The profile picture with a chevron. A click opens a card with the name and
  // subtitle from Settings, Profile, and a button that opens that section.
  let { profile, onopenprofile }: { profile: ShellProfile; onopenprofile: () => void } = $props();

  let open = $state(false);
  const letters = $derived(initials(profile.name));

  function edit() {
    open = false;
    onopenprofile();
  }
</script>

{#snippet avatar(size: string)}
  {#if profile.photoUrl}
    <img src={profile.photoUrl} alt="" class="{size} shrink-0 rounded-full object-cover" data-testid="profile-photo" />
  {:else}
    <span
      class="{size} grid shrink-0 place-items-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
      data-testid="profile-initials"
    >
      {#if letters}{letters}{:else}<UserRound class="size-1/2" aria-hidden="true" />{/if}
    </span>
  {/if}
{/snippet}

<Popover.Root bind:open>
  <Popover.Trigger
    aria-label="Profile"
    data-testid="profile-menu"
    class="flex cursor-pointer items-center gap-1 rounded-full p-0.5 pr-1.5 text-muted-foreground transition-colors hover:bg-(color:--accent-bg)/12 hover:text-(color:--accent-text)"
  >
    {@render avatar('size-9')}
    <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
  </Popover.Trigger>
  <Popover.Portal>
    <Popover.Content
      side="bottom"
      align="end"
      sideOffset={8}
      class="z-50 w-64 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
      data-testid="profile-card"
    >
      <div class="flex items-center gap-3">
        {@render avatar('size-12')}
        <div class="min-w-0">
          {#if profile.name}
            <p class="truncate font-medium" data-testid="profile-name">{profile.name}</p>
            {#if profile.subtitle}
              <p class="truncate text-sm text-muted-foreground" data-testid="profile-subtitle">{profile.subtitle}</p>
            {/if}
          {:else}
            <p class="font-medium">No name yet</p>
            <p class="text-sm text-muted-foreground">Add it in Settings, Profile.</p>
          {/if}
        </div>
      </div>
      <button
        type="button"
        class="mt-4 w-full cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-(color:--accent-bg)/12 hover:text-(color:--accent-text)"
        data-testid="profile-edit"
        onclick={edit}
      >
        {profile.name ? 'Edit profile' : 'Add your name'}
      </button>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
