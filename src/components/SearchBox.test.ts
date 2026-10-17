import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import SearchBox from './SearchBox.svelte';
import { db } from '$lib/db';
import { navigation } from '$lib/navigation.svelte';
import { addContact, blankInput } from '$lib/repo/contacts';

beforeEach(async () => {
  navigation.screen = 'dashboard';
  navigation.contactId = null;

  const connection = await db();
  // The connection is the one this test file shares, so each test starts from
  // the same two contacts rather than the ones the last one left behind.
  await connection.execute('DELETE FROM contacts');
  await addContact(connection, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
  await addContact(connection, { ...blankInput(), firstName: 'Grace', lastName: 'Hopper' });
});

async function type(text: string) {
  await fireEvent.input(screen.getByTestId('search-box'), { target: { value: text } });
}

function results(): string[] {
  return screen.queryAllByTestId('search-result').map((result) => result.getAttribute('data-contact-name') ?? '');
}

describe('the search box', () => {
  it('shows nothing until the user types', () => {
    render(SearchBox);
    expect(screen.queryByTestId('search-results')).toBeNull();
  });

  it('updates the results as the text changes', async () => {
    render(SearchBox);

    await type('a');
    await waitFor(() => expect(results()).toContain('Ada Lovelace'));

    await type('grace');
    await waitFor(() => expect(results()).toEqual(['Grace Hopper']));

    await type('turing');
    await waitFor(() => expect(results()).toEqual([]));
  });

  it('finds a contact by part of a last name', async () => {
    render(SearchBox);

    await type('Hopp');

    await waitFor(() => expect(results()).toEqual(['Grace Hopper']));
  });

  it('says so when nothing matches', async () => {
    render(SearchBox);

    await type('nobody');

    await waitFor(() => expect(screen.getByTestId('search-empty').textContent).toBe('No contacts found'));
  });

  it('takes the search away when the box is emptied', async () => {
    render(SearchBox);
    await type('Ada');
    await waitFor(() => expect(results()).toEqual(['Ada Lovelace']));

    await type('');

    await waitFor(() => expect(screen.queryByTestId('search-results')).toBeNull());
  });

  it('opens the contact page when a result is chosen', async () => {
    render(SearchBox);
    await type('Ada');
    await waitFor(() => expect(results()).toEqual(['Ada Lovelace']));

    await fireEvent.click(screen.getByTestId('search-result'));

    expect(navigation.screen).toBe('contact');
    expect(navigation.contactId).toBeTypeOf('number');
    expect(screen.queryByTestId('search-results')).toBeNull();
  });

  it('takes the search away on Escape', async () => {
    render(SearchBox);
    await type('Ada');
    await waitFor(() => expect(results()).toEqual(['Ada Lovelace']));

    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByTestId('search-results')).toBeNull();
  });
});