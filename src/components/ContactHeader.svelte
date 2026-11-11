<script lang="ts">
  import Avatar from './Avatar.svelte';
  import ContactForm from './ContactForm.svelte';
  import EditableCard from './EditableCard.svelte';
  import Missions from './Missions.svelte';
  import { labelFor } from '$lib/categories';
  import { formatDate } from '$lib/dates';
  import { fullName, type Contact, type ContactFormResult } from '$lib/repo/contacts';

  let {
    contact,
    tags,
    onsave,
  }: {
    contact: Contact;
    tags: string[];
    onsave: (result: ContactFormResult) => void | Promise<void>;
  } = $props();

  let failure = $state('');

  async function save(result: ContactFormResult, close: () => void) {
    failure = '';
    try {
      await onsave(result);
      close();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<EditableCard label="contact details" testid="contact-header">
  {#snippet view()}
    <div class="flex flex-wrap items-start gap-6 pr-12">
      <div class="flex items-center gap-4">
        <Avatar picture={contact.picture} name={fullName(contact)} size={72} />
        <div class="min-w-0">
          <h1 class="truncate text-xl font-semibold" data-testid="contact-name">{fullName(contact)}</h1>
          <p class="text-sm text-muted" data-testid="contact-category">{labelFor(contact.category)}</p>
          <p class="text-sm text-muted" data-testid="contact-email">{contact.email ?? 'Email not set'}</p>
          <p class="text-sm text-muted" data-testid="contact-phone">{contact.phone ?? 'Phone not set'}</p>
          <p class="text-sm text-muted" data-testid="contact-birthday">
            {contact.birthday ? `Born ${formatDate(contact.birthday)}` : 'Birthday not set'}
          </p>
          {#if tags.length === 0}
            <p class="text-sm text-muted" data-testid="contact-tags">Tags not set</p>
          {:else}
            <ul class="mt-1 flex flex-wrap gap-2" data-testid="contact-tags">
              {#each tags as tag (tag)}
                <li class="border-line bg-bg rounded-full border px-2 py-1 text-xs" data-testid="contact-tag" data-tag={tag}>{tag}</li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
      <Missions contactId={contact.id} />
    </div>
  {/snippet}

  {#snippet edit(close)}
    {#if failure}<p class="error mb-2" data-testid="contact-header-failure">{failure}</p>{/if}
    <ContactForm embedded {contact} {tags} onsave={(result) => save(result, close)} oncancel={close} />
  {/snippet}
</EditableCard>
