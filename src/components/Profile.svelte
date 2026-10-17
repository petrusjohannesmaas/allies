<script lang="ts">
  import { db } from '$lib/db';
  import { getProfileText, setProfileText, type ProfileText } from '$lib/repo/details';

  let { contactId }: { contactId: number } = $props();

  const FIELDS = [
    { key: 'how_met', label: 'How they met', testId: 'how-met' },
    { key: 'work', label: 'Work', testId: 'work' },
    { key: 'food_preferences', label: 'Food preferences', testId: 'food-preferences' },
  ] as const satisfies readonly { key: keyof ProfileText; label: string; testId: string }[];

  let text = $state<ProfileText>({ how_met: '', work: '', food_preferences: '' });
  let failure = $state('');

  $effect(() => {
    void load(contactId);
  });

  async function load(id: number) {
    text = await getProfileText(await db(), id);
  }

  async function save() {
    failure = '';
    try {
      await setProfileText(await db(), contactId, text);
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<section class="card" data-testid="profile">
  <h3 class="section-title">About</h3>

  {#if failure}<p class="error" data-testid="profile-failure">{failure}</p>{/if}

  <form
    class="mt-3 grid gap-2"
    data-testid="profile-form"
    onsubmit={(event) => {
      event.preventDefault();
      void save();
    }}
  >
    {#each FIELDS as field (field.key)}
      <label class="block">
        <span class="field-label">{field.label}</span>
        <textarea class="input" rows="2" data-testid={field.testId} bind:value={text[field.key]}></textarea>
      </label>
    {/each}
    <button type="submit" class="btn btn-primary justify-self-start" data-testid="save-profile">Save</button>
  </form>
</section>