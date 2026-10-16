import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Journal from './Journal.svelte';
import { db } from '$lib/db';
import { today } from '$lib/dates';

beforeEach(async () => {
  await (await db()).execute('DELETE FROM day_ratings');
});

function ratingRows() {
  return screen.queryAllByTestId('journal-row').filter((row) => row.getAttribute('data-kind') === 'rating');
}

describe('the journal screen', () => {
  it('lists the rating row as soon as the day is rated', async () => {
    render(Journal);
    await waitFor(() => expect(screen.getByTestId('rate-happy')).toBeTruthy());
    expect(ratingRows()).toEqual([]);

    await fireEvent.click(screen.getByTestId('rate-happy'));

    await waitFor(() => expect(ratingRows()).toHaveLength(1));
    expect(ratingRows()[0].getAttribute('data-day')).toBe(today());
    expect(ratingRows()[0].textContent).toContain('You rated your day: Happy');
  });
});
