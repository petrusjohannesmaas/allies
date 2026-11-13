<script lang="ts">
  import { db } from '$lib/db';
  import { fullName, listContacts, type Contact } from '$lib/repo/contacts';
  import type { About, AboutInput } from '$lib/repo/details';

  let {
    contactId,
    about,
    onsave,
    oncancel,
  }: {
    contactId: number;
    about: About;
    onsave: (input: AboutInput) => void | Promise<void>;
    oncancel: () => void;
  } = $props();

  // The form lives only while the card is in edit mode, so these start from the
  // saved values each time the pencil opens it.
  function initial(): AboutInput {
    return {
      significantOtherId: about.significant_other?.id ?? null,
      childIds: about.children.map((child) => child.id),
      howMet: about.how_met ?? '',
      work: about.work ?? '',
      foodPreferences: about.food_preferences ?? '',
    };
  }

  const start = JSON.stringify(initial());
  let draft = $state<AboutInput>(initial());
  let partner = $state(draft.significantOtherId === null ? '' : String(draft.significantOtherId));
  let chosenChild = $state('');
  let contacts = $state<Contact[]>([]);

  $effect(() => {
    void (async () => {
      // A contact cannot be its own significant other or child, so it is not offered.
      contacts = (await listContacts(await db())).filter((contact) => contact.id !== contactId);
    })();
  });

  const changed = $derived(JSON.stringify({ ...draft, significantOtherId: partner === '' ? null : Number(partner) }) !== start);
  const childChoices = $derived(contacts.filter((contact) => !draft.childIds.includes(contact.id)));

  function nameOf(id: number): string {
    const contact = contacts.find((candidate) => candidate.id === id) ?? about.children.find((child) => child.id === id);
    return contact ? fullName(contact) : String(id);
  }

  function addChild() {
    if (chosenChild === '') return;
    draft.childIds = [...draft.childIds, Number(chosenChild)];
    chosenChild = '';
  }
</script>

<form
  class="mt-3 grid gap-3"
  data-testid="profile-form"
  onsubmit={(event) => {
    event.preventDefault();
    void onsave({ ...draft, significantOtherId: partner === '' ? null : Number(partner) });
  }}
>
  <label class="block">
    <span class="field-label">Significant other</span>
    <select class="input" data-testid="partner-picker" bind:value={partner}>
      <option value="">Not set</option>
      {#each contacts as contact (contact.id)}
        <option value={String(contact.id)}>{fullName(contact)}</option>
      {/each}
    </select>
  </label>

  <div>
    <span class="field-label">Children</span>
    <ul class="grid gap-2" data-testid="child-list">
      {#each draft.childIds as id (id)}
        <li class="flex items-center gap-3" data-testid="child" data-child-name={nameOf(id)}>
          <span class="flex-1 text-sm">{nameOf(id)}</span>
          <button
            type="button"
            class="btn btn-danger shrink-0"
            data-testid="remove-child"
            onclick={() => (draft.childIds = draft.childIds.filter((childId) => childId !== id))}
          >
            Remove
          </button>
        </li>
      {/each}
    </ul>
    {#if childChoices.length > 0}
      <div class="mt-2 flex gap-2">
        <select class="input" aria-label="Add a child from the contacts" data-testid="child-picker" bind:value={chosenChild}>
          <option value="">Choose a contact</option>
          {#each childChoices as contact (contact.id)}
            <option value={String(contact.id)}>{fullName(contact)}</option>
          {/each}
        </select>
        <button type="button" class="btn" data-testid="add-child" onclick={addChild}>Add child</button>
      </div>
    {/if}
  </div>

  <label class="block">
    <span class="field-label">How you met</span>
    <textarea class="input" rows="2" data-testid="how-met-input" bind:value={draft.howMet}></textarea>
  </label>
  <label class="block">
    <span class="field-label">Work</span>
    <textarea class="input" rows="2" data-testid="work-input" bind:value={draft.work}></textarea>
  </label>
  <label class="block">
    <span class="field-label">Food preferences</span>
    <textarea class="input" rows="2" data-testid="food-preferences-input" bind:value={draft.foodPreferences}></textarea>
  </label>

  <div class="flex gap-2">
    {#if changed}
      <button type="submit" class="btn btn-primary" data-testid="save-profile">Save</button>
    {/if}
    <button type="button" class="btn" data-testid="cancel-profile" onclick={oncancel}>Cancel</button>
  </div>
</form>
