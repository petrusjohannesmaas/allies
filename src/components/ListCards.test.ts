import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Activities from './Activities.svelte';
import Addresses from './Addresses.svelte';
import Calls from './Calls.svelte';
import Notes from './Notes.svelte';
import Reminders from './Reminders.svelte';
import { db } from '$lib/db';
import { addActivity } from '$lib/repo/activities';
import { addCall } from '$lib/repo/calls';
import { addContact, blankInput } from '$lib/repo/contacts';
import { addAddress } from '$lib/repo/details';
import { addNote } from '$lib/repo/notes';
import { addReminder } from '$lib/repo/reminders';

let contactId: number;

beforeEach(async () => {
  const connection = await db();
  await connection.execute('DELETE FROM contacts');
  contactId = await addContact(connection, { ...blankInput(), firstName: 'Ada' });
});

const cards = [
  { name: 'Notes', component: Notes, row: 'note', form: 'note-form', remove: 'delete-note', seed: async () => addNote(await db(), contactId, 'A note') },
  { name: 'Calls', component: Calls, row: 'call', form: 'call-form', remove: 'delete-call', seed: async () => addCall(await db(), contactId, '2026-01-02', 'A call') },
  {
    name: 'Activities',
    component: Activities,
    row: 'activity',
    form: 'activity-form',
    remove: 'delete-activity',
    seed: async () => addActivity(await db(), contactId, 'did sport together', '2026-01-02', 'An outing'),
  },
  {
    name: 'Addresses',
    component: Addresses,
    row: 'address',
    form: 'address-form',
    remove: 'delete-address',
    seed: async () => addAddress(await db(), contactId, { street: '12 Kei Road', city: '', postalCode: '', country: '' }),
  },
  {
    name: 'Reminders',
    component: Reminders,
    row: 'reminder',
    form: 'reminder-form',
    remove: 'delete-reminder',
    seed: async () => addReminder(await db(), contactId, '2026-12-01', 'A reminder', false),
  },
];

describe('a list card', () => {
  it.each(cards)('hides its controls until the pencil: $name', async ({ component, row, form, remove, seed }) => {
    await seed();
    render(component, { props: { contactId } });
    await waitFor(() => expect(screen.queryAllByTestId(row)).toHaveLength(1));

    expect(screen.queryByTestId(form)).toBeNull();
    expect(screen.queryByTestId(remove)).toBeNull();

    await fireEvent.click(screen.getByTestId('edit-card'));

    expect(screen.getByTestId(form)).toBeTruthy();
    expect(screen.getByTestId(remove)).toBeTruthy();
  });
});
