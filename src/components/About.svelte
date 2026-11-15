<script lang="ts">
  import { Briefcase, Baby, Handshake, Heart, UserRound, Utensils } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import AboutForm from './AboutForm.svelte';
  import EditableCard from './EditableCard.svelte';
  import FieldLabel from './FieldLabel.svelte';
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

<EditableCard label="About" title="About" icon={UserRound} testid="about">
  {#snippet view()}
    {#if about}
      <dl class="mt-3 grid gap-4 text-sm">
        <div>
          <FieldLabel icon={Heart}>Significant other</FieldLabel>
          <dd data-testid="significant-other">
            {#if about.significant_other}
              <Button variant="outline" size="sm" data-testid="open-partner" onclick={() => openContact(about!.significant_other!.id)}>
                {fullName(about.significant_other)}
              </Button>
            {:else}
              <span class="italic text-muted-foreground">Significant other not set</span>
            {/if}
          </dd>
        </div>
        <div>
          <FieldLabel icon={Baby}>Children</FieldLabel>
          <dd data-testid="children">
            {#if about.children.length === 0}
              <span class="italic text-muted-foreground">Children not set</span>
            {:else}
              <ul class="flex flex-wrap gap-2" data-testid="child-list">
                {#each about.children as child (child.id)}
                  <li data-testid="child" data-child-name={fullName(child)}>
                    <Button variant="outline" size="sm" data-testid="open-child" onclick={() => openContact(child.id)}>
                      {fullName(child)}
                    </Button>
                  </li>
                {/each}
              </ul>
            {/if}
          </dd>
        </div>
        <div>
          <FieldLabel icon={Handshake}>How you met</FieldLabel>
          <dd class="whitespace-pre-wrap" class:italic={!about.how_met} class:text-muted-foreground={!about.how_met} data-testid="how-met">{about.how_met ?? 'How you met not set'}</dd>
        </div>
        <div>
          <FieldLabel icon={Briefcase}>Work</FieldLabel>
          <dd class="whitespace-pre-wrap" class:italic={!about.work} class:text-muted-foreground={!about.work} data-testid="work">{about.work ?? 'Work not set'}</dd>
        </div>
        <div>
          <FieldLabel icon={Utensils}>Food preferences</FieldLabel>
          <dd class="whitespace-pre-wrap" class:italic={!about.food_preferences} class:text-muted-foreground={!about.food_preferences} data-testid="food-preferences">
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
