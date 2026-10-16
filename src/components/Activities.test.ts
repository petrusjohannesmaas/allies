import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Activities from './Activities.svelte';
import { db } from '$lib/db';
import { today } from '$lib/dates';
import { ACTIVITY_CATEGORIES } from '$lib/activity-categories';
import { addContact, blankInput } from '$lib/repo/contacts';
import { addActivity, listActivities } from '$lib/repo/activities';

let contactId: number;

beforeEach(async () => {
  const connection = await db();
  await connection.execute('DELETE FROM contacts');
  contactId = await addContact(connection, { ...blankInput(), firstName: 'Ada' });
});

async function renderActivities(rows = 0) {
  render(Activities, { props: { contactId } });
  await waitFor(() => expect(screen.queryAllByTestId('activity')).toHaveLength(rows));
}

async function logActivity(date: string, category: string, description: string) {
  await fireEvent.input(screen.getByTestId('activity-date'), { target: { value: date } });
  await fireEvent.change(screen.getByTestId('activity-category'), { target: { value: category } });
  await fireEvent.input(screen.getByTestId('activity-description'), { target: { value: description } });
  await fireEvent.click(screen.getByTestId('save-activity'));
}

describe('the activities section', () => {
  it('says so when nothing was logged', async () => {
    await renderActivities();
    expect(screen.getByTestId('activities-empty')).toBeTruthy();
  });

  it('offers every category in the picker', async () => {
    await renderActivities();

    const offered = [...(screen.getByTestId('activity-category') as HTMLSelectElement).options].map(
      (option) => option.textContent?.trim(),
    );

    expect(offered).toEqual([...ACTIVITY_CATEGORIES]);
  });

  it('starts the date at today', async () => {
    await renderActivities();
    expect((screen.getByTestId('activity-date') as HTMLInputElement).value).toBe(today());
  });

  it('logs an activity with the category, the date and the description', async () => {
    await renderActivities();

    await logActivity('2026-10-14', 'did sport together', 'We went skiing');

    await waitFor(() => expect(screen.getByTestId('activity-description-value').textContent).toBe('We went skiing'));
    expect(screen.getByTestId('activity-category-value').textContent).toBe('did sport together');
    expect(screen.getByTestId('activity-date-value').textContent).toBe('14 October 2026');
    expect((await listActivities(await db(), contactId))[0].happened_on).toBe('2026-10-14');
  });

  it('will not log an activity with no description', async () => {
    await renderActivities();

    await logActivity('2026-10-14', 'did sport together', '   ');

    expect(screen.getByTestId('activities-empty')).toBeTruthy();
  });

  it('will not log an activity with no date', async () => {
    await renderActivities();

    await logActivity('', 'did sport together', 'We went skiing');

    expect(screen.getByTestId('activities-empty')).toBeTruthy();
  });

  it('lists the activities newest first', async () => {
    await renderActivities();

    await logActivity('2026-10-08', 'ate at a restaurant', 'Lunch at the diner');
    await logActivity('2026-10-14', 'did sport together', 'We went skiing');

    await waitFor(() => expect(screen.getAllByTestId('activity-description-value')).toHaveLength(2));
    expect(screen.getAllByTestId('activity-description-value').map((row) => row.textContent)).toEqual([
      'We went skiing',
      'Lunch at the diner',
    ]);
  });

  it('removes an activity the user deletes', async () => {
    const connection = await db();
    await addActivity(connection, contactId, 'ate at a restaurant', '2026-10-08', 'Lunch at the diner');
    await addActivity(connection, contactId, 'did sport together', '2026-10-14', 'We went skiing');
    await renderActivities(2);

    await fireEvent.click(screen.getAllByTestId('delete-activity')[0]);

    await waitFor(() => expect(screen.getAllByTestId('activity-description-value')).toHaveLength(1));
    expect(screen.getByTestId('activity-description-value').textContent).toBe('Lunch at the diner');
  });
});

describe('the last activity line', () => {
  it('reads never when nothing was logged', async () => {
    await renderActivities();
    expect(screen.getByTestId('last-activity').textContent).toBe('Last activity together: never');
  });

  it('reads the date of the most recent activity', async () => {
    const connection = await db();
    await addActivity(connection, contactId, 'ate at a restaurant', '2026-10-08', 'Lunch at the diner');
    await addActivity(connection, contactId, 'did sport together', '2026-10-14', 'We went skiing');
    await renderActivities(2);

    await waitFor(() => expect(screen.getByTestId('last-activity').textContent).toBe('Last activity together: 14 October 2026'));
  });
});
