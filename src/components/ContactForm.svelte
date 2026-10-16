<script lang="ts">
  import { CATEGORIES } from '$lib/categories';
  import { validateContact, type ContactErrors } from '$lib/contact-validation';
  import { blankInput, toInput, type Contact, type ContactInput } from '$lib/repo/contacts';

  let {
    contact = null,
    onsave,
    oncancel = () => {},
    title,
  }: {
    contact?: Contact | null;
    onsave: (input: ContactInput) => void | Promise<void>;
    oncancel?: () => void;
    title?: string;
  } = $props();

  // The form takes the contact once, when it mounts. Contacts.svelte keys the
  // form on the contact it edits, so a different contact is a new form rather
  // than a reset of this one's edits.
  // svelte-ignore state_referenced_locally
  let input = $state<ContactInput>(contact ? toInput(contact) : blankInput());
  let errors = $state<ContactErrors>({});

  const heading = $derived(title ?? (contact ? 'Edit contact' : 'Add contact'));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    errors = validateContact(input);
    if (Object.keys(errors).length > 0) return;
    await onsave(input);
  }
</script>

<form class="card grid gap-3" data-testid="contact-form" onsubmit={submit}>
  <h2 class="text-base font-semibold">{heading}</h2>

  <label class="block">
    <span class="field-label">Category</span>
    <select class="input" data-testid="contact-category" bind:value={input.category}>
      {#each CATEGORIES as category (category)}
        <option value={category}>{category}</option>
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
    <span class="field-label">Birthday</span>
    <input class="input" type="date" data-testid="contact-birthday" bind:value={input.birthday} />
  </label>

  <div class="flex gap-2">
    <button type="submit" class="btn btn-primary" data-testid="save-contact">Save</button>
    <button type="button" class="btn" data-testid="cancel-contact" onclick={oncancel}>Cancel</button>
  </div>
</form>