<script lang="ts">
  import { appInfo } from '$lib/app-info';
  import { InfoSection, Placeholder, SettingsShell } from '$lib/components/shell';
  import { navigation } from '$lib/navigation.svelte';
  import Appearance from './Appearance.svelte';
</script>

<SettingsShell uniqueLabel="Email" bind:section={navigation.settingsSection}>
  {#snippet appearance()}<Appearance />{/snippet}
  {#snippet unique()}
    <Placeholder title="Email and calendar" note="IMAP and SMTP setup for email and the calendar comes later." />
  {/snippet}
  {#snippet info()}
    <InfoSection
      logo={appInfo.logo}
      appName={appInfo.name}
      description={appInfo.description}
      attribution={appInfo.attribution}
    >
      <p class="text-sm text-muted-foreground">
        Everything stays on this computer: there is no account, no sync and no network access.
      </p>
    </InfoSection>
  {/snippet}
  {#snippet profile()}
    <Placeholder title="Profile" note="Your name, subtitle and picture, as Zaimu has them. Not built yet." />
  {/snippet}
  {#snippet data()}
    <Placeholder title="Data" note="Backup and export. Not built yet." />
  {/snippet}
</SettingsShell>
