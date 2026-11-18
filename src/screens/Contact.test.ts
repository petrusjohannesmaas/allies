import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App.svelte';
import Contact from './Contact.svelte';
import { db } from '$lib/db';
import { navigation, openContact } from '$lib/navigation.svelte';
import { addContact, blankInput, getContact } from '$lib/repo/contacts';
import { addCall } from '$lib/repo/calls';
import { addActivity } from '$lib/repo/activities';
import { addAddress } from '$lib/repo/details';
import { addNote } from '$lib/repo/notes';
import { addReminder } from '$lib/repo/reminders';

beforeEach(() => {
  document.body.innerHTML = '';
});

/** The visible text of a button, ignoring what only a screen reader hears. */
function visibleText(button: HTMLElement): string {
  return (button.textContent ?? '').trim();
}

describe('the contact page controls', () => {
  it('every button on a contact page has a name and every icon-only button a tooltip', async () => {
    const connection = await db();
    await connection.execute('DELETE FROM contacts');
    const id = await addContact(connection, { ...blankInput(), firstName: 'Ada' });
    await addNote(connection, id, 'A note');
    await addCall(connection, id, '2026-11-01', 'A call');
    await addActivity(connection, id, 'did something else', '2026-11-02', 'An activity');
    await addAddress(connection, id, { street: '1 Main Road', city: 'Cape Town', postalCode: '8001', country: 'South Africa' });
    await addReminder(connection, id, '2026-12-01', 'A reminder', false);
    openContact(id);
    render(Contact);
    await screen.findByTestId('contact-grid');
    await waitFor(() => expect(screen.queryAllByTestId('note')).toHaveLength(1));

    for (const pencil of screen.getAllByTestId('edit-card')) await fireEvent.click(pencil);
    await waitFor(() => expect(screen.queryAllByTestId('delete-note')).toHaveLength(1));

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(6);
    for (const button of buttons) {
      const name = button.getAttribute('aria-label') ?? visibleText(button);
      expect(name, button.outerHTML).not.toBe('');
      if (visibleText(button) === '') {
        const hasTooltip = button.hasAttribute('title') || button.getAttribute('data-slot') === 'tooltip-trigger';
        expect(hasTooltip, `no tooltip on ${button.outerHTML}`).toBe(true);
      }
    }
  });
});

describe('deleting from the contact page', () => {
  async function openAda() {
    const connection = await db();
    await connection.execute('DELETE FROM contacts');
    const id = await addContact(connection, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
    openContact(id);
    render(Contact);
    await screen.findByTestId('contact-grid');
    return { connection, id };
  }

  it('Delete asks first, and Cancel keeps the contact', async () => {
    const { connection, id } = await openAda();
    await fireEvent.click(screen.getByTestId('delete-contact'));
    expect(await screen.findByText('Delete Ada Lovelace?')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('cancel-delete'));
    expect(await getContact(connection, id)).not.toBeNull();
    expect(screen.queryByText('Delete Ada Lovelace?')).toBeNull();
    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0);
  });

  it('Confirming Delete removes the contact and opens Home', async () => {
    const { connection, id } = await openAda();
    await fireEvent.click(screen.getByTestId('delete-contact'));
    await fireEvent.click(await screen.findByTestId('confirm-delete'));
    await waitFor(async () => expect(await getContact(connection, id)).toBeNull());
    expect(navigation.screen).toBe('home');
  });

  it('Deleting the last contact leaves Home empty', async () => {
    const connection = await db();
    await connection.execute('DELETE FROM contacts');
    const id = await addContact(connection, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
    openContact(id);
    render(App);
    await fireEvent.click(await screen.findByTestId('delete-contact'));
    await fireEvent.click(await screen.findByTestId('confirm-delete'));
    await waitFor(() => expect(navigation.screen).toBe('home'));
    expect(await screen.findByTestId('contacts-empty')).toBeTruthy();
    expect(await screen.findByTestId('contact-panel-empty')).toBeTruthy();
  });
});
