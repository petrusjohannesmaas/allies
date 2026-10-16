<script lang="ts">
  import { Cake, CalendarCheck, Users } from '@lucide/svelte';
  import { db } from '$lib/db';
  import { formatDate, today, upcoming, type UpcomingMonth } from '$lib/dates';
  import { openContact } from '$lib/navigation.svelte';
  import { countContacts } from '$lib/repo/contacts';
  import { countCallsAndActivities, listBirthdays, listDatedReminders, listRecentlyViewed, type RecentContact } from '$lib/repo/dashboard';

  let months = $state<UpcomingMonth[]>([]);
  let recent = $state<RecentContact[]>([]);
  let counts = $state({ contacts: 0, interactions: 0 });
  let failure = $state('');

  $effect(() => {
    void reload();
  });

  async function reload() {
    failure = '';
    try {
      const connection = await db();
      // The window is worked out here rather than in SQL, so one rule decides
      // what the dashboard shows.
      months = upcoming(await listBirthdays(connection), await listDatedReminders(connection), today());
      recent = await listRecentlyViewed(connection);
      counts = {
        contacts: await countContacts(connection),
        interactions: await countCallsAndActivities(connection),
      };
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<section class="p-6" data-testid="screen-dashboard">
  <h1 class="text-xl font-semibold">Dashboard</h1>

  {#if failure}<p class="error mt-2" data-testid="dashboard-failure">{failure}</p>{/if}

  <div class="mt-4 flex flex-wrap gap-3">
    <p class="card flex items-center gap-2 text-sm" data-testid="count-contacts">
      <Users class="size-4 text-muted" aria-hidden="true" />
      <span><strong>{counts.contacts}</strong> Contacts</span>
    </p>
    <p class="card flex items-center gap-2 text-sm" data-testid="count-interactions">
      <CalendarCheck class="size-4 text-muted" aria-hidden="true" />
      <span><strong>{counts.interactions}</strong> Calls and activities</span>
    </p>
  </div>

  <section class="card mt-4" data-testid="upcoming">
    <h2 class="section-title">Next three months</h2>

    {#if months.length === 0}
      <p class="mt-3 text-sm text-muted" data-testid="upcoming-empty">Nothing coming up.</p>
    {:else}
      {#each months as month (month.month)}
        <h3 class="mt-4 text-sm font-semibold" data-testid="upcoming-month">{month.label}</h3>
        <ul class="mt-2 grid gap-1">
          {#each month.dates as date (date.kind + date.day + date.contactId)}
            <li
              class="border-line flex items-center gap-3 border-t py-2 text-sm"
              data-testid="upcoming-date"
              data-day={date.day}
              data-kind={date.kind}
              data-contact-name={date.contactName}
            >
              <span class="w-32 shrink-0 text-xs text-muted" data-testid="upcoming-date-value">{formatDate(date.day)}</span>
              <span class="w-24 shrink-0 truncate text-xs text-muted" data-testid="upcoming-date-kind">
                {date.kind === 'birthday' ? 'Birthday' : 'Reminder'}
              </span>
              <button type="button" class="btn flex-1 text-left" data-testid="open-upcoming-contact" onclick={() => openContact(date.contactId)}>
                {date.contactName}
              </button>
              {#if date.description}
                <span class="min-w-0 flex-1 truncate text-xs text-muted" data-testid="upcoming-date-description">{date.description}</span>
              {/if}
              {#if date.kind === 'birthday'}
                <Cake class="size-4 shrink-0 text-muted" aria-hidden="true" />
              {/if}
            </li>
          {/each}
        </ul>
      {/each}
    {/if}
  </section>

  <section class="card mt-4" data-testid="recent">
    <h2 class="section-title">Recently viewed</h2>

    {#if recent.length === 0}
      <p class="mt-3 text-sm text-muted" data-testid="recent-empty">No contacts opened yet.</p>
    {:else}
      <ul class="mt-3 flex flex-wrap gap-2">
        {#each recent as contact (contact.id)}
          <li data-testid="recent-contact" data-contact-name={contact.name}>
            <button type="button" class="btn" data-testid="open-recent-contact" onclick={() => openContact(contact.id)}>
              {contact.name}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</section>
