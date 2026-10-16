import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DayRating from './DayRating.svelte';
import { db, setDb, type Db } from '$lib/db';
import { getRating } from '$lib/repo/journal';

const TODAY = '2026-10-16';

beforeEach(async () => {
  await (await db()).execute('DELETE FROM day_ratings');
});

async function renderRating(onRated?: () => void) {
  render(DayRating, { props: { day: TODAY, onRated } });
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

  it('tells the screen once when a rating was saved', async () => {
    const onRated = vi.fn();
    await renderRating(onRated);

    await choose('happy');

    expect(onRated).toHaveBeenCalledTimes(1);
  });

  it('does not tell the screen when the second rating is refused', async () => {
    const onRated = vi.fn();
    await renderRating(onRated);
    await choose('neutral');
    onRated.mockClear();

    await fireEvent.click(screen.getByTestId('rate-happy'));
    await waitFor(() => expect(screen.getByTestId('rating-refused')).toBeTruthy());

    expect(onRated).not.toHaveBeenCalled();
  });
});

describe('a rating that fails for another reason', () => {
  let real: Db;

  beforeEach(async () => {
    real = await db();
    setDb({
      select: (sql, bind) => real.select(sql, bind),
      execute: (sql, bind) =>
        sql.includes('INSERT INTO day_ratings') ? Promise.reject(new Error('database is locked')) : real.execute(sql, bind),
    });
  });

  afterEach(() => setDb(real));

  it('shows the failure and not the refusal on an unrated day', async () => {
    const onRated = vi.fn();
    await renderRating(onRated);

    await fireEvent.click(screen.getByTestId('rate-happy'));

    await waitFor(() => expect(screen.getByTestId('rating-failure')).toBeTruthy());
    expect(screen.getByTestId('rating-failure').textContent).toContain('database is locked');
    expect(screen.queryByTestId('rating-refused')).toBeNull();
    expect(screen.getByTestId('day-rating').getAttribute('data-rated')).toBeNull();
    expect(screen.queryByTestId('today-rating')).toBeNull();
    expect(onRated).not.toHaveBeenCalled();
  });

  it('keeps the face the day already had when the failure comes on a rated day', async () => {
    await real.execute('INSERT INTO day_ratings (day, face) VALUES ($1, $2)', [TODAY, 2]);
    await renderRating();
    await waitFor(() => expect(screen.getByTestId('day-rating').getAttribute('data-rated')).toBe('2'));

    await fireEvent.click(screen.getByTestId('rate-happy'));

    await waitFor(() => expect(screen.getByTestId('rating-refused')).toBeTruthy());
    expect(screen.getByTestId('day-rating').getAttribute('data-rated')).toBe('2');
  });
});
