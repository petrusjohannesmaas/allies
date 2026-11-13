<script lang="ts">
  import Avatar from './Avatar.svelte';
  import { CATEGORIES, labelFor } from '$lib/categories';
  import { validateContact, type ContactErrors } from '$lib/contact-validation';
  import {
    blankInput,
    parseTags,
    toInput,
    type Contact,
    type ContactFormResult,
    type ContactInput,
  } from '$lib/repo/contacts';
  import { ACCEPTED_TYPES, imageTypeOf, pictureUrl, type ChosenFile } from '$lib/repo/pictures';

  let {
    contact = null,
    tags = [],
    embedded = false,
    onsave,
    oncancel = () => {},
    title,
  }: {
    contact?: Contact | null;
    /** The contact's tags, which live in their own table. */
    tags?: string[];
    /** Inside a card that has its own frame and title, so the form adds neither. */
    embedded?: boolean;
    onsave: (result: ContactFormResult) => void | Promise<void>;
    oncancel?: () => void;
    title?: string;
  } = $props();

  // The form takes the contact once, when it mounts. Contacts.svelte keys the
  // form on the contact it edits, so a different contact is a new form rather
  // than a reset of this one's edits.
  // svelte-ignore state_referenced_locally
  let input = $state<ContactInput>(contact ? toInput(contact, tags) : blankInput());
  // svelte-ignore state_referenced_locally
  let tagsText = $state(input.tags.join(', '));
  // svelte-ignore state_referenced_locally
  const start = JSON.stringify(current());
  let errors = $state<ContactErrors>({});
  let chosen = $state<ChosenFile | null>(null);
  let pictureError = $state('');
  let preview = $state<string | null>(null);

  // An existing contact saves only once something differs from what it opened with.
  const changed = $derived(chosen !== null || JSON.stringify(current()) !== start);
  const heading = $derived(title ?? (contact ? 'Edit contact' : 'Add contact'));
  const name = $derived([input.firstName, input.lastName].filter(Boolean).join(' '));

  // The preview is an object URL, which is handed back when the choice changes
  // or the form goes away.
  $effect(() => {
    if (!chosen) {
      preview = null;
      return;
    }
    const url = pictureUrl(chosen.bytes, chosen.type);
    preview = url;
    return () => URL.revokeObjectURL(url);
  });

  async function pick(event: Event) {
    const field = event.currentTarget as HTMLInputElement;
    const file = field.files?.[0];
    if (!file) return;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = imageTypeOf(bytes);
    if (!type) {
      chosen = null;
      pictureError = `"${file.name}" is not a PNG, JPEG, WebP or GIF image.`;
      return;
    }
    pictureError = '';
    chosen = { name: file.name, type, bytes };
  }

  /** The input as it would be saved, with the tags field read as a comma-separated list. */
  function current(): ContactInput {
    return { ...input, tags: parseTags(tagsText.split(',')) };
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    const result = current();
    errors = validateContact(result);
    if (Object.keys(errors).length > 0) return;
    await onsave({ input: result, picture: chosen });
  }
</script>

<form class={embedded ? 'grid gap-3' : 'card grid gap-3'} data-testid="contact-form" onsubmit={submit}>
  {#if !embedded}<h2 class="text-base font-semibold">{heading}</h2>{/if}

  <div class="flex items-start gap-3">
    <div class="relative">
      <Avatar picture={null} {name} size={56} />
      {#if preview}<img src={preview} alt="" class="absolute inset-0 size-14 rounded-full object-cover" data-testid="picture-preview" />{/if}
    </div>
    <label class="block flex-1">
      <span class="field-label">Profile picture</span>
      <input class="input" type="file" accept={ACCEPTED_TYPES.join(',')} data-testid="contact-picture" onchange={pick} />
      {#if pictureError}<p class="error" data-testid="error-picture">{pictureError}</p>{/if}
    </label>
  </div>

  <label class="block">
    <span class="field-label">Category</span>
    <select class="input" data-testid="contact-category" bind:value={input.category}>
      {#each CATEGORIES as category (category)}
        <option value={category}>{labelFor(category)}</option>
      {/each}
    </select>
  </label>

  <label class="block">
    <span class="field-label">First name</span>
    <input class="input" data-testid="contact-first-name" autocomplete="off" bind:value={input.firstName} />
    {#if errors.firstName}<p class="error" data-testid="error-first-name">{errors.firstName}</p>{/if}
  </label>

  <label class="block">
    <span class="field-label">Last name</span>
    <input class="input" data-testid="contact-last-name" autocomplete="off" bind:value={input.lastName} />
  </label>

  <label class="block">
    <span class="field-label">Email</span>
    <input class="input" data-testid="contact-email" autocomplete="off" bind:value={input.email} />
    {#if errors.email}<p class="error" data-testid="error-email">{errors.email}</p>{/if}
  </label>

  <label class="block">
    <span class="field-label">Phone</span>
    <input class="input" data-testid="contact-phone" autocomplete="off" placeholder="082 123 4567" bind:value={input.phone} />
  </label>

  <label class="block">
    <span class="field-label">Birthday</span>
    <input class="input" type="date" data-testid="contact-birthday" bind:value={input.birthday} />
  </label>

  <label class="block">
    <span class="field-label">Tags, separated by commas</span>
    <input class="input" data-testid="contact-tags" autocomplete="off" placeholder="chess, books" bind:value={tagsText} />
  </label>

  <div class="flex gap-2">
    {#if !contact || changed}
      <button type="submit" class="btn btn-primary" data-testid="save-contact">Save</button>
    {/if}
    <button type="button" class="btn" data-testid="cancel-contact" onclick={oncancel}>Cancel</button>
  </div>
</form>