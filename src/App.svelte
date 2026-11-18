<script lang="ts">
  import { CalendarDays, House, MessagesSquare, Target } from '@lucide/svelte';
  import { appInfo } from './lib/app-info';
  import { AppShell, Placeholder, type NavItem } from './lib/components/shell';
  import { navigation, open, type Screen } from './lib/navigation.svelte';
  import { settings } from './lib/settings.svelte';
  import Contact from './screens/Contact.svelte';
  import Home from './screens/Home.svelte';
  import Journal from './screens/Journal.svelte';
  import Mission from './screens/Mission.svelte';
  import Settings from './screens/Settings.svelte';

  const home: NavItem = { id: 'home', label: 'Home', icon: House };
  const features: [NavItem, NavItem, NavItem] = [
    { id: 'missions', label: 'Missions', icon: Target },
    { id: 'interactions', label: 'Interactions', icon: MessagesSquare },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  ];

  // A contact and a mission belong to Home and Missions in the sidebar.
  const current = $derived(
    navigation.screen === 'contact' ? 'home' : navigation.screen === 'mission' ? 'missions' : navigation.screen,
  );
</script>

<AppShell
  logo={appInfo.logo}
  appName={appInfo.name}
  {home}
  {features}
  {current}
  onnavigate={(id) => open(id as Screen)}
>
  {#if settings.loadError}
    <p class="m-4 text-sm text-destructive" role="alert" data-testid="settings-load-error">
      {settings.loadError}
    </p>
  {/if}

  <div class="h-full" data-testid="open-screen">
    {#key navigation.visit}
      {#if navigation.screen === 'home'}
        <Home />
      {:else if navigation.screen === 'contact'}
        <Contact />
      {:else if navigation.screen === 'mission'}
        <Mission />
      {:else if navigation.screen === 'missions'}
        <section class="p-6" data-testid="screen-missions">
          <h1 class="text-xl font-semibold">Missions</h1>
          <div class="mt-6"><Placeholder title="Missions" note="Every mission with its ally's avatar. Not built yet." /></div>
        </section>
      {:else if navigation.screen === 'interactions'}
        <!-- The journal stands in until the interactions log is built. -->
        <Journal />
      {:else if navigation.screen === 'calendar'}
        <section class="p-6" data-testid="screen-calendar">
          <h1 class="text-xl font-semibold">Calendar</h1>
          <div class="mt-6">
            <Placeholder title="Calendar" note="Birthdays, reminders and mission due dates. Not built yet." />
          </div>
        </section>
      {:else}
        <Settings />
      {/if}
    {/key}
  </div>
</AppShell>
