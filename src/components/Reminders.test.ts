import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Reminders from './Reminders.svelte';
import { db } from '$lib/db';
import { today } from '$lib/dates';
import { addContact, blankInput } from '$lib/repo/contacts';
import { addReminder, listReminders } from '$lib/repo/reminders';

let contactId: number;

beforeEach(async () => {
  const connection = await db();
  await connection.execute('DELETE FROM contacts');
  contactId = await addContact(connection, { ...blankInput(), firstName: 'Ada' });
});

async function renderReminders(rows = 0) {
  render(Reminders, { props: { contactId } });
  await waitFor(() => expect(screen.queryAllByTestId('reminder')).toHaveLength(rows));
}

async function add(date: string, description: string, repeats: boolean) {
  await fireEvent.input(screen.getByTestId('reminder-date'), { target: { value: date } });
  await fireEvent.input(screen.getByTestId('reminder-description'), { target: { value: description } });
  await fireEvent.change(screen.getByTestId('reminder-repeats'), { target: { checked: repeats } });
  await fireEvent.click(screen.getByTestId('save-reminder'));
}

describe('the reminders section', () => {
  it('says so when the contact has none', async () => {
    await renderReminders();
    expect(screen.getByTestId('reminders-empty')).toBeTruthy();
  });

  it('starts the date at today', async () => {
    await renderReminders();
    expect((screen.getByTestId('reminder-date') as HTMLInputElement).value).toBe(today());
  });

  it('adds a reminder that does not repeat', async () => {
    await renderReminders();

    await add('2026-10-26', 'Send the photos', false);

    await waitFor(() => expect(screen.getByTestId('reminder-description-value').textContent).toBe('Send the photos'));
    expect(screen.getByTestId('reminder-date-value').textContent).toBe('26 October 2026');
    expect(screen.getByTestId('reminder-repeats-value').textContent).toBe('Once');
    expect((await listReminders(await db(), contactId))[0].repeats_yearly).toBe(0);
  });

  it('adds a reminder that repeats every year', async () => {
    await renderReminders();

    await add('2026-10-26', 'Call for her birthday', true);

    await waitFor(() => expect(screen.getByTestId('reminder-repeats-value').textContent).toBe('Every year'));
    expect((await listReminders(await db(), contactId))[0].repeats_yearly).toBe(1);
  });

  it('leaves the repeat off when the user clears it', async () => {
    await renderReminders();

    await add('2026-10-26', 'Send the photos', true);
    await waitFor(() => expect(screen.queryAllByTestId('reminder')).toHaveLength(1));

    await add('2026-11-05', 'Call for her birthday', false);

    await waitFor(() => expect(screen.queryAllByTestId('reminder')).toHaveLength(2));
    expect(screen.getAllByTestId('reminder-repeats-value').map((row) => row.textContent)).toEqual([
      'Every year',
      'Once',
    ]);
  });

  it('will not add a reminder with no date', async () => {
    await renderReminders();

    await add('', 'Send the photos', false);

    expect(screen.getByTestId('reminders-empty')).toBeTruthy();
  });

  it('will not add a reminder with no description', async () => {
    await renderReminders();

    await add('2026-10-26', '   ', false);

    expect(screen.getByTestId('reminders-empty')).toBeTruthy();
  });

  it('lists the soonest reminder first', async () => {
    await renderReminders();

    await add('2026-11-05', 'Later', false);
    await add('2026-10-26', 'Sooner', false);

    await waitFor(() => expect(screen.getAllByTestId('reminder-description-value')).toHaveLength(2));
    expect(screen.getAllByTestId('reminder-description-value').map((row) => row.textContent)).toEqual([
      'Sooner',
      'Later',
    ]);
  });

  it('removes a reminder the user deletes', async () => {
    const connection = await db();
    await addReminder(connection, contactId, '2026-10-26', 'Send the photos', false);
    await addReminder(connection, contactId, '2026-11-05', 'Call for her birthday', true);
    await renderReminders(2);

    await fireEvent.click(screen.getAllByTestId('delete-reminder')[0]);

    await waitFor(() => expect(screen.getAllByTestId('reminder-description-value')).toHaveLength(1));
    expect(screen.getByTestId('reminder-description-value').textContent).toBe('Call for her birthday');
  });
});
