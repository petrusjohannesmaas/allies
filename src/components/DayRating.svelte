<script lang="ts">
  import { Frown, Meh, Smile } from '@lucide/svelte';
  import { db } from '$lib/db';
  import { getRating, rateDay } from '$lib/repo/journal';

  let { day }: { day: string } = $props();

  const FACES = [
    { face: 1, name: 'Sad', Icon: Frown },
    { face: 2, name: 'Neutral', Icon: Meh },
    { face: 3, name: 'Happy', Icon: Smile },
  ] as const;

  let chosen = $state<number | null>(null);
  let refused = $state('');
  let failure = $state('');

  $effect(() => {
    void load(day);
  });

  async function load(when: string) {
    chosen = await getRating(await db(), when);
  }

  async function choose(face: number) {
    refused = '';
    failure = '';
    try {
      await rateDay(await db(), day, face);
      chosen = face;
    } catch {
      // The primary key refuses the second rating for a day, so the face the
      // day already has is read back and shown.
      refused = 'Today is already rated.';
      chosen = await getRating(await db(), day);
    }
  }
</script>

<section class="card" data-testid="day-rating" data-rated={chosen}>
  <h2 class="section-title">How was your day? You can rate it once a day.</h2>

  <div class="mt-3 flex items-center gap-2" role="group" aria-label="Rate your day">
    {#each FACES as option (option.face)}
      <button
        type="button"
        class="btn p-2"
        class:btn-primary={chosen === option.face}
        aria-label={option.name}
        aria-pressed={chosen === option.face}
        data-testid={`rate-${option.name.toLowerCase()}`}
        onclick={() => void choose(option.face)}
      >
        <option.Icon class="size-6" aria-hidden="true" />
      </button>
    {/each}
  </div>

  {#if chosen !== null}
    <p class="mt-3 text-sm" data-testid="today-rating">You rated your day: {FACES.find((option) => option.face === chosen)?.name}</p>
  {/if}

  {#if refused}<p class="error mt-2" data-testid="rating-refused">{refused}</p>{/if}
  {#if failure}<p class="error mt-2" data-testid="rating-failure">{failure}</p>{/if}
</section>
