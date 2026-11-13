<script lang="ts">
  import { Label } from '$lib/components/ui/label';
  import { Check } from '@lucide/svelte';
  import { accentFillHex, accents } from '$lib/accents';
  import { settings } from '$lib/settings.svelte';
  import { themes } from '../themes';
</script>

<section class="max-w-xl p-6" data-testid="screen-appearance">
  <h1 class="text-xl font-semibold">Appearance</h1>

  <fieldset class="mt-6">
    <legend class="text-sm font-medium">Theme</legend>
    <div class="mt-2 flex flex-col gap-2">
      {#each themes as theme (theme.id)}
        <Label class="flex cursor-pointer items-center gap-2 text-sm hover:text-[var(--accent-text)]">
          <input
            type="radio"
            name="theme"
            value={theme.id}
            class="accent-[var(--accent-bg)]"
            checked={settings.theme === theme.id}
            onchange={() => settings.setTheme(theme.id)}
          />
          {theme.name}
        </Label>
      {/each}
    </div>
  </fieldset>

  <fieldset class="mt-6">
    <legend class="text-sm font-medium">Accent</legend>
    <div class="mt-2 flex flex-wrap gap-3">
      {#each accents as accent (accent.id)}
        <button
          type="button"
          class="flex size-10 cursor-pointer items-center justify-center rounded-full text-primary-foreground transition-shadow hover:ring-2 hover:ring-foreground/50 ring-offset-2 ring-offset-background focus-visible:outline-2 focus-visible:outline-ring {settings.accent === accent.id ? 'ring-2 ring-foreground' : ''}"
          style:background-color={accentFillHex(accent.id)}
          aria-label={accent.name}
          aria-pressed={settings.accent === accent.id}
          title={accent.name}
          onclick={() => settings.setAccent(accent.id)}
        >
          {#if settings.accent === accent.id}<Check size={18} aria-hidden="true" />{/if}
        </button>
      {/each}
    </div>
  </fieldset>

  {#if settings.saveError}
    <p class="mt-4 text-sm text-destructive" role="alert" data-testid="settings-save-error">{settings.saveError}</p>
  {/if}
</section>
