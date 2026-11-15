<script lang="ts">
  import { Cake, Mail, Phone, Tag } from '@lucide/svelte';
  import Avatar from './Avatar.svelte';
  import ContactForm from './ContactForm.svelte';
  import EditableCard from './EditableCard.svelte';
  import FieldLabel from './FieldLabel.svelte';
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

  const placeholder = 'italic text-muted-foreground';
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
          <p class="text-sm text-muted-foreground" data-testid="contact-category">{labelFor(contact.category)}</p>
          <dl class="mt-3 grid gap-4 text-sm">
            <div>
              <FieldLabel icon={Mail}>Email</FieldLabel>
              <dd class={contact.email ? '' : placeholder} data-testid="contact-email">{contact.email ?? 'Email not set'}</dd>
            </div>
            <div>
              <FieldLabel icon={Phone}>Phone</FieldLabel>
              <dd class={contact.phone ? '' : placeholder} data-testid="contact-phone">{contact.phone ?? 'Phone not set'}</dd>
            </div>
            <div>
              <FieldLabel icon={Cake}>Birthday</FieldLabel>
              <dd class={contact.birthday ? '' : placeholder} data-testid="contact-birthday">
                {contact.birthday ? `Born ${formatDate(contact.birthday)}` : 'Birthday not set'}
              </dd>
            </div>
            <div>
              <FieldLabel icon={Tag}>Tags</FieldLabel>
              {#if tags.length === 0}
                <dd class={placeholder} data-testid="contact-tags">Tags not set</dd>
              {:else}
                <dd>
                  <ul class="flex flex-wrap gap-2" data-testid="contact-tags">
                    {#each tags as tag (tag)}
                      <li class="border-border bg-background rounded-full border px-2 py-1 text-xs" data-testid="contact-tag" data-tag={tag}>{tag}</li>
                    {/each}
                  </ul>
                </dd>
              {/if}
            </div>
          </dl>
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
