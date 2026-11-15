<script lang="ts">
  import IconButton from './IconButton.svelte';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { fieldClass } from '$lib/field';
  import { cn } from '$lib/utils';
  import { Baby, Briefcase, Handshake, Heart, Plus, Save, Trash2, Utensils, X } from '@lucide/svelte';
  import FieldLabel from './FieldLabel.svelte';
  import { Button } from '$lib/components/ui/button';
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
  <Label class="block">
    <FieldLabel as="span" icon={Heart}>Significant other</FieldLabel>
    <select class={cn(fieldClass, '')} data-testid="partner-picker" bind:value={partner}>
      <option value="">Not set</option>
      {#each contacts as contact (contact.id)}
        <option value={String(contact.id)}>{fullName(contact)}</option>
      {/each}
    </select>
  </Label>

  <div>
    <FieldLabel as="span" icon={Baby}>Children</FieldLabel>
    <ul class="grid gap-2" data-testid="child-list">
      {#each draft.childIds as id (id)}
        <li class="flex items-center gap-3" data-testid="child" data-child-name={nameOf(id)}>
          <span class="flex-1 text-sm">{nameOf(id)}</span>
          <IconButton
            class="shrink-0 text-destructive hover:text-destructive"
            label="Remove {nameOf(id)}"
            data-testid="remove-child"
            onclick={() => (draft.childIds = draft.childIds.filter((childId) => childId !== id))}
          >
            <Trash2 aria-hidden="true" />
          </IconButton>
        </li>
      {/each}
    </ul>
    {#if childChoices.length > 0}
      <div class="mt-2 flex gap-2">
        <select class={cn(fieldClass, '')} aria-label="Add a child from the contacts" data-testid="child-picker" bind:value={chosenChild}>
          <option value="">Choose a contact</option>
          {#each childChoices as contact (contact.id)}
            <option value={String(contact.id)}>{fullName(contact)}</option>
          {/each}
        </select>
        <Button variant="outline" data-testid="add-child" onclick={addChild}><Plus aria-hidden="true" />Add child</Button>
      </div>
    {/if}
  </div>

  <Label class="block">
    <FieldLabel as="span" icon={Handshake}>How you met</FieldLabel>
    <Textarea rows={2} data-testid="how-met-input" bind:value={draft.howMet} />
  </Label>
  <Label class="block">
    <FieldLabel as="span" icon={Briefcase}>Work</FieldLabel>
    <Textarea rows={2} data-testid="work-input" bind:value={draft.work} />
  </Label>
  <Label class="block">
    <FieldLabel as="span" icon={Utensils}>Food preferences</FieldLabel>
    <Textarea rows={2} data-testid="food-preferences-input" bind:value={draft.foodPreferences} />
  </Label>

  <div class="flex gap-2">
    {#if changed}
      <Button type="submit" data-testid="save-profile"><Save aria-hidden="true" />Save</Button>
    {/if}
    <Button variant="outline" data-testid="cancel-profile" onclick={oncancel}><X aria-hidden="true" />Cancel</Button>
  </div>
</form>
