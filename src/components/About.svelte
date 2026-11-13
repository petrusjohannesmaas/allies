<script lang="ts">
  import AboutForm from './AboutForm.svelte';
  import EditableCard from './EditableCard.svelte';
  import { db } from '$lib/db';
  import { openContact } from '$lib/navigation.svelte';
  import { fullName } from '$lib/repo/contacts';
  import { getAbout, saveAbout, type About, type AboutInput } from '$lib/repo/details';

  let { contactId }: { contactId: number } = $props();

  let about = $state<About | null>(null);
  let failure = $state('');

  $effect(() => {
    void load(contactId);
  });

  async function load(id: number) {
    about = await getAbout(await db(), id);
  }

  async function save(input: AboutInput, close: () => void) {
    failure = '';
    try {
      await saveAbout(await db(), contactId, input);
      await load(contactId);
      close();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<EditableCard label="About" title="About" testid="about">
  {#snippet view()}
    {#if about}
      <dl class="mt-3 grid gap-2 text-sm">
        <div>
          <dt class="field-label">Significant other</dt>
          <dd data-testid="significant-other">
            {#if about.significant_other}
              <button type="button" class="btn" data-testid="open-partner" onclick={() => openContact(about!.significant_other!.id)}>
                {fullName(about.significant_other)}
              </button>
            {:else}
              <span class="text-muted-foreground">Significant other not set</span>
            {/if}
          </dd>
        </div>
        <div>
          <dt class="field-label">Children</dt>
          <dd data-testid="children">
            {#if about.children.length === 0}
              <span class="text-muted-foreground">Children not set</span>
            {:else}
              <ul class="flex flex-wrap gap-2" data-testid="child-list">
                {#each about.children as child (child.id)}
                  <li data-testid="child" data-child-name={fullName(child)}>
                    <button type="button" class="btn" data-testid="open-child" onclick={() => openContact(child.id)}>
                      {fullName(child)}
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </dd>
        </div>
        <div>
          <dt class="field-label">How you met</dt>
          <dd class="whitespace-pre-wrap" class:text-muted-foreground={!about.how_met} data-testid="how-met">{about.how_met ?? 'How you met not set'}</dd>
        </div>
        <div>
          <dt class="field-label">Work</dt>
          <dd class="whitespace-pre-wrap" class:text-muted-foreground={!about.work} data-testid="work">{about.work ?? 'Work not set'}</dd>
        </div>
        <div>
          <dt class="field-label">Food preferences</dt>
          <dd class="whitespace-pre-wrap" class:text-muted-foreground={!about.food_preferences} data-testid="food-preferences">
            {about.food_preferences ?? 'Food preferences not set'}
          </dd>
        </div>
      </dl>
    {/if}
  {/snippet}

  {#snippet edit(close)}
    {#if failure}<p class="error mt-3" data-testid="profile-failure">{failure}</p>{/if}
    {#if about}
      <AboutForm {contactId} {about} onsave={(input) => save(input, close)} oncancel={close} />
    {/if}
  {/snippet}
</EditableCard>
