import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Calls from './Calls.svelte';
import { db } from '$lib/db';
import { today } from '$lib/dates';
import { addContact, blankInput } from '$lib/repo/contacts';
import { addCall, listCalls } from '$lib/repo/calls';

let contactId: number;

beforeEach(async () => {
  const connection = await db();
  await connection.execute('DELETE FROM contacts');
  contactId = await addContact(connection, { ...blankInput(), firstName: 'Ada' });
});

async function renderCalls(rows = 0) {
  render(Calls, { props: { contactId } });
  await waitFor(() => expect(screen.queryAllByTestId('call')).toHaveLength(rows));
}

async function logCall(date: string, description: string) {
  await fireEvent.input(screen.getByTestId('call-date'), { target: { value: date } });
  await fireEvent.input(screen.getByTestId('call-description'), { target: { value: description } });
  await fireEvent.click(screen.getByTestId('save-call'));
}

describe('the calls section', () => {
  it('says so when the contact was never called', async () => {
    await renderCalls();
    expect(screen.getByTestId('calls-empty')).toBeTruthy();
  });

  it('starts the date at today', async () => {
    await renderCalls();
    expect((screen.getByTestId('call-date') as HTMLInputElement).value).toBe(today());
  });

  it('logs a call with the date and the description the user chose', async () => {
    await renderCalls();

    await logCall('2026-10-13', 'Caught up about the conference');

    await waitFor(() => expect(screen.getByTestId('call-description-value').textContent).toBe('Caught up about the conference'));
    expect((await listCalls(await db(), contactId))[0].called_on).toBe('2026-10-13');
  });

  it('shows the date as a person reads it', async () => {
    await renderCalls();

    await logCall('2026-10-13', 'Caught up');

    await waitFor(() => expect(screen.getByTestId('call-date-value').textContent).toBe('13 October 2026'));
  });

  it('will not log a call with no date', async () => {
    await renderCalls();

    await logCall('', 'Caught up');

    expect(screen.getByTestId('calls-empty')).toBeTruthy();
  });

  it('will not log a call with no description', async () => {
    await renderCalls();

    await logCall('2026-10-13', '   ');

    expect(screen.getByTestId('calls-empty')).toBeTruthy();
  });

  it('lists the calls newest first', async () => {
    await renderCalls();

    await logCall('2026-10-08', 'First call');
    await logCall('2026-10-13', 'Second call');

    await waitFor(() => expect(screen.getAllByTestId('call-description-value')).toHaveLength(2));
    expect(screen.getAllByTestId('call-description-value').map((row) => row.textContent)).toEqual([
      'Second call',
      'First call',
    ]);
  });

  it('removes a call the user deletes', async () => {
    const connection = await db();
    await addCall(connection, contactId, '2026-10-08', 'First call');
    await addCall(connection, contactId, '2026-10-13', 'Second call');
    await renderCalls(2);

    await fireEvent.click(screen.getAllByTestId('delete-call')[1]);

    await waitFor(() => expect(screen.getAllByTestId('call-description-value')).toHaveLength(1));
    expect(screen.getByTestId('call-description-value').textContent).toBe('Second call');
  });
});

describe('the last call line', () => {
  it('reads never when there are no calls', async () => {
    await renderCalls();
    expect(screen.getByTestId('last-called').textContent).toBe('Last called: never');
  });

  it('reads the date of the most recent call', async () => {
    const connection = await db();
    await addCall(connection, contactId, '2026-10-08', 'First call');
    await addCall(connection, contactId, '2026-10-13', 'Second call');
    await renderCalls();

    await waitFor(() => expect(screen.getByTestId('last-called').textContent).toBe('Last called: 13 October 2026'));
  });
});
