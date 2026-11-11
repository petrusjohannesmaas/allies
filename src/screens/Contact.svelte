<script lang="ts">
  import Activities from '../components/Activities.svelte';
  import Addresses from '../components/Addresses.svelte';
  import Calls from '../components/Calls.svelte';
  import ContactHeader from '../components/ContactHeader.svelte';
  import Children from '../components/Children.svelte';
  import Missions from '../components/Missions.svelte';
  import Notes from '../components/Notes.svelte';
  import Profile from '../components/Profile.svelte';
  import Reminders from '../components/Reminders.svelte';
  import SignificantOther from '../components/SignificantOther.svelte';
  import { db, type Db } from '../lib/db';
  import { goBackFromContact, navigation } from '../lib/navigation.svelte';
  import { getContact, markViewed, updateContactWithPicture, type Contact, type ContactFormResult } from '../lib/repo/contacts';
  import { listTags } from '../lib/repo/details';

  let contact = $state<Contact | null>(null);
  let tags = $state<string[]>([]);
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
    tags = contact ? await listTags(connection, id) : [];
    missing = contact === null;
  }

  async function saveHeader({ input, picture }: ContactFormResult) {
    if (!contact) return;
    const connection = await db();
    await updateContactWithPicture(connection, contact, input, picture);
    await load(connection, contact.id);
  }
</script>

<section class="p-6" data-testid="screen-contact">
  {#if missing}
    <p class="text-sm text-muted" data-testid="contact-missing">That contact is gone.</p>
  {:else if contact}
    <button type="button" class="btn mb-4" data-testid="back-to-contacts" onclick={goBackFromContact}>All contacts</button>

    <div class="mb-4">
      <ContactHeader {contact} {tags} onsave={saveHeader} />
    </div>

    <!-- One component per section, so the later screens add theirs without
         touching what is here. -->
    <div class="grid gap-4">
      <Calls contactId={contact.id} />
      <Activities contactId={contact.id} />
      <Addresses contactId={contact.id} />
      <SignificantOther contactId={contact.id} />
      <Children contactId={contact.id} />
      <Profile contactId={contact.id} />
      <Reminders contactId={contact.id} />
      <Notes contactId={contact.id} />
      <Missions contactId={contact.id} />
    </div>
  {/if}
</section>