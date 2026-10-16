import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import DayRating from './DayRating.svelte';
import { db } from '$lib/db';
import { getRating } from '$lib/repo/journal';

const TODAY = '2026-10-16';

beforeEach(async () => {
  await (await db()).execute('DELETE FROM day_ratings');
});

async function renderRating() {
  render(DayRating, { props: { day: TODAY } });
  await waitFor(() => expect(screen.getByTestId('rate-sad')).toBeTruthy());
}

async function choose(face: 'sad' | 'neutral' | 'happy') {
  await fireEvent.click(screen.getByTestId(`rate-${face}`));
  await waitFor(() => expect(screen.getByTestId('day-rating').getAttribute('data-rated')).not.toBeNull());
}

describe('rating the day', () => {
  it('offers the three faces', async () => {
    await renderRating();

    expect(screen.getByRole('button', { name: 'Sad' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Neutral' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Happy' })).toBeTruthy();
    expect(screen.getByTestId('day-rating').getAttribute('data-rated')).toBeNull();
  });

  it('shows the face the user picked', async () => {
    await renderRating();

    await choose('happy');

    expect(screen.getByTestId('today-rating').textContent).toBe('You rated your day: Happy');
    expect(screen.getByTestId('day-rating').getAttribute('data-rated')).toBe('3');
    expect(await getRating(await db(), TODAY)).toBe(3);
  });

  it('shows a face the day already had', async () => {
    await renderRating();

    await choose('sad');

    expect(screen.getByTestId('today-rating').textContent).toBe('You rated your day: Sad');
  });

  it('refuses a second face and shows the one already chosen', async () => {
    await renderRating();

    await choose('neutral');
    await fireEvent.click(screen.getByTestId('rate-happy'));

    await waitFor(() => expect(screen.getByTestId('rating-refused')).toBeTruthy());
    expect(screen.getByTestId('rating-refused').textContent).toBe('Today is already rated.');
    expect(screen.getByTestId('today-rating').textContent).toBe('You rated your day: Neutral');
    expect(await getRating(await db(), TODAY)).toBe(2);
  });

  it('shows the face again when the screen comes back', async () => {
    const first = render(DayRating, { props: { day: TODAY } });
    await waitFor(() => expect(screen.getByTestId('rate-sad')).toBeTruthy());
    await choose('happy');

    first.unmount();
    render(DayRating, { props: { day: TODAY } });

    await waitFor(() => expect(screen.getByTestId('today-rating').textContent).toBe('You rated your day: Happy'));
  });
});
