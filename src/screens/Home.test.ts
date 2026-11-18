import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Home from './Home.svelte';
import { db } from '$lib/db';
import { home } from '$lib/home.svelte';
import { addContact, blankInput } from '$lib/repo/contacts';

async function reset() {
  const connection = await db();
  await connection.execute('DELETE FROM contacts');
  home.selectedId = null;
  return connection;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

function rowOf(name: string): HTMLElement {
  return screen.getAllByTestId('contact-row').find((row) => row.getAttribute('data-contact-name') === name)!;
}

describe('the contact list and the panel', () => {
  it('Clicking a row shows that contact and leaves its last view alone', async () => {
    const connection = await reset();
    const ada = await addContact(connection, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
    await addContact(connection, { ...blankInput(), firstName: 'Grace', lastName: 'Hopper' });
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    await connection.execute('UPDATE contacts SET last_viewed_at = $1 WHERE id = $2', [fiveMinutesAgo, ada]);
    home.selectedId = ada;

    render(Home);
    await waitFor(() => expect(screen.getByTestId('panel-name').textContent).toBe('Ada Lovelace'));
    await fireEvent.click(rowOf('Grace Hopper'));

    await waitFor(() => expect(screen.getByTestId('panel-name').textContent).toBe('Grace Hopper'));
    expect(rowOf('Grace Hopper').getAttribute('aria-current')).toBe('true');
    expect(within(rowOf('Grace Hopper')).getByTestId('contact-row-menu')).toBeTruthy();
    expect(within(rowOf('Ada Lovelace')).getByTestId('contact-row-chevron')).toBeTruthy();
    expect(rowOf('Ada Lovelace').getAttribute('aria-current')).toBeNull();

    // Reading Home again shows the rows as the click left them: Ada still at
    // the time she was viewed before the click, and Grace still never viewed,
    // so the click recorded no view for either.
    await new Promise((done) => setTimeout(done, 0));
    cleanup();
    render(Home);
    await waitFor(() => expect(within(rowOf('Ada Lovelace')).getByTestId('contact-row-time').textContent).toBe('5m ago'));
    expect(within(rowOf('Grace Hopper')).getByTestId('contact-row-time').textContent).toBe('');
  });

  it('The panel shows placeholders for missing values', async () => {
    const connection = await reset();
    await addContact(connection, { ...blankInput(), firstName: 'Ada' });

    render(Home);

    const panel = await screen.findByTestId('contact-panel');
    await waitFor(() => expect(panel.textContent).toContain('No phone'));
    expect(panel.textContent).toContain('No email');
    expect(panel.textContent).toContain('No location');
    expect(panel.textContent).toContain('No notes yet');
  });

  it('Add contact swaps the list for the form', async () => {
    const connection = await reset();
    await addContact(connection, { ...blankInput(), firstName: 'Ada' });

    render(Home);
    await screen.findByTestId('contacts-list');
    await fireEvent.click(screen.getByTestId('add-contact'));

    expect(screen.getByTestId('contact-form')).toBeTruthy();
    expect(screen.queryByTestId('contacts-list')).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.getByTestId('contacts-list').textContent).toContain('Ada'));
    expect(screen.queryByTestId('contact-form')).toBeNull();

    await fireEvent.click(screen.getByTestId('add-contact'));
    await fireEvent.input(screen.getByTestId('contact-first-name'), { target: { value: 'Grace' } });
    await fireEvent.click(screen.getByTestId('save-contact'));

    await waitFor(() => expect(screen.getByTestId('contacts-list')).toBeTruthy());
    await waitFor(() => expect(screen.getByTestId('panel-name').textContent).toBe('Grace'));
  });
});
