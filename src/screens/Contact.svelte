<script lang="ts">
  import Activities from '../components/Activities.svelte';
  import Addresses from '../components/Addresses.svelte';
  import Avatar from '../components/Avatar.svelte';
  import Calls from '../components/Calls.svelte';
  import Children from '../components/Children.svelte';
  import Missions from '../components/Missions.svelte';
  import Notes from '../components/Notes.svelte';
  import Phones from '../components/Phones.svelte';
  import Profile from '../components/Profile.svelte';
  import Reminders from '../components/Reminders.svelte';
  import SignificantOther from '../components/SignificantOther.svelte';
  import Tags from '../components/Tags.svelte';
  import { db, type Db } from '../lib/db';
  import { goBackFromContact, navigation } from '../lib/navigation.svelte';
  import { fullName, getContact, markViewed, type Contact } from '../lib/repo/contacts';

  let contact = $state<Contact | null>(null);
  let missing = $state(false);

  // Opening a page is what counts as viewing a contact, so the dashboard's
  // recently viewed list picks this one up. The effect reads only the id, so
  // it runs once per contact rather than on every reload.
  $effect(() => {
    const id = navigation.contactId;
    if (id === null) return;
    void (async () => {
      const connection = await db();
      await load(connection, id);
      await markViewed(connection, id);
    })();
  });

  async function load(connection: Db, id: number) {
    contact = await getContact(connection, id);
    missing = contact === null;
  }
</script>

<section class="p-6" data-testid="screen-contact">
  {#if missing}
    <p class="text-sm text-muted" data-testid="contact-missing">That contact is gone.</p>
  {:else if contact}
    <button type="button" class="btn mb-4" data-testid="back-to-contacts" onclick={goBackFromContact}>All contacts</button>

    <header class="card mb-4 flex items-center gap-4" data-testid="contact-header">
      <Avatar picture={contact.picture} name={fullName(contact)} size={72} />
      <div class="min-w-0">
        <h1 class="truncate text-xl font-semibold" data-testid="contact-name">{fullName(contact)}</h1>
        <p class="text-sm text-muted" data-testid="contact-category">{contact.category}</p>
        {#if contact.email}<p class="text-sm text-muted" data-testid="contact-email">{contact.email}</p>{/if}
        {#if contact.birthday}<p class="text-sm text-muted" data-testid="contact-birthday">Born {contact.birthday}</p>{/if}
      </div>
    </header>

    <!-- One component per section, so the later screens add theirs without
         touching what is here. -->
    <div class="grid gap-4">
      <Phones contactId={contact.id} />
      <Calls contactId={contact.id} />
      <Activities contactId={contact.id} />
      <Addresses contactId={contact.id} />
      <SignificantOther contactId={contact.id} />
      <Children contactId={contact.id} />
      <Profile contactId={contact.id} />
      <Reminders contactId={contact.id} />
      <Tags contactId={contact.id} />
      <Notes contactId={contact.id} />
      <Missions contactId={contact.id} />
    </div>
  {/if}
</section>