import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App.svelte';
import { db } from './lib/db';
import { navigation, open, openContact } from './lib/navigation.svelte';
import { addContact, blankInput } from './lib/repo/contacts';

beforeEach(() => {
  navigation.screen = 'dashboard';
  navigation.contactId = null;
});

describe('the top bar', () => {
  it('shows the search box on the dashboard', () => {
    render(App);
    expect(screen.getByTestId('search-box')).toBeTruthy();
    expect(screen.getByTestId('screen-dashboard')).toBeTruthy();
  });

  it.each([
    ['dashboard', 'screen-dashboard'],
    ['contacts', 'screen-contacts'],
    ['contact', 'screen-contact'],
    ['journal', 'screen-journal'],
  ] as const)('shows the search box on the %s screen', (screenName, testId) => {
    open(screenName);
    render(App);
    expect(screen.getByTestId('search-box')).toBeTruthy();
    expect(screen.getByTestId(testId)).toBeTruthy();
  });

  it('keeps the search box when the user moves between the screens the top bar offers', async () => {
    render(App);

    for (const label of ['Contacts', 'Journal', 'Dashboard']) {
      await fireEvent.click(screen.getByRole('button', { name: label }));
      expect(screen.getByTestId('search-box')).toBeTruthy();
    }
    expect(screen.getByTestId('screen-dashboard')).toBeTruthy();
  });

  it('shows the contact screen when a contact is opened, and still has the search box', async () => {
    const connection = await db();
    const id = await addContact(connection, { ...blankInput(), firstName: 'Ada' });

    openContact(id);
    render(App);

    await waitFor(() => expect(screen.getByTestId('contact-name').textContent).toBe('Ada'));
    expect(screen.getByTestId('search-box')).toBeTruthy();
  });

  it('says so when the contact is gone', async () => {
    openContact(999);
    render(App);
    await waitFor(() => expect(screen.getByTestId('contact-missing')).toBeTruthy());
  });
});