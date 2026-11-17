<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { SettingsSectionId } from './types';

  // The Settings page: one row of tabs in a fixed order, then the open
  // section. Each app fills the five sections; `uniqueLabel` names the one
  // that is its own (S1), such as Categories, Email or API key.
  let {
    uniqueLabel,
    section = $bindable('appearance'),
    appearance,
    unique,
    info,
    profile,
    data,
  }: {
    uniqueLabel: string;
    section?: SettingsSectionId;
    appearance: Snippet;
    unique: Snippet;
    info: Snippet;
    profile: Snippet;
    data: Snippet;
  } = $props();

  const tabs = $derived<{ id: SettingsSectionId; name: string }[]>([
    { id: 'appearance', name: 'Appearance' },
    { id: 'unique', name: uniqueLabel },
    { id: 'info', name: 'Info' },
    { id: 'profile', name: 'Profile' },
    { id: 'data', name: 'Data' },
  ]);

  const content = $derived({ appearance, unique, info, profile, data }[section]);
</script>

<section class="p-8" data-testid="settings-page">
  <h1 class="text-2xl font-semibold">Settings</h1>
  <nav class="mt-6 flex gap-2 border-b border-border" aria-label="Settings sections">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        aria-current={section === tab.id ? 'page' : undefined}
        data-testid="settings-tab-{tab.id}"
        onclick={() => (section = tab.id)}
        class="-mb-px cursor-pointer border-b-2 px-3 pb-2 text-sm transition-colors {section === tab.id
          ? 'border-(color:--accent-bg) font-medium text-(color:--accent-text)'
          : 'border-transparent text-muted-foreground hover:text-foreground'}"
      >
        {tab.name}
      </button>
    {/each}
  </nav>
  <div class="mt-8" data-testid="settings-section" data-section={section}>
    {@render content()}
  </div>
</section>
