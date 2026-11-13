import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App.svelte';
import { db } from './lib/db';
import { navigation, open, openContact } from './lib/navigation.svelte';
import { addContact, blankInput } from './lib/repo/contacts';
import { settings } from './lib/settings.svelte';
import { fakeStore } from './test/fake-store';

beforeEach(() => {
  navigation.screen = 'dashboard';
  navigation.contactId = null;
});

describe('the sidebar', () => {
  // This test runs first in the file, because the settings store opens once per
  // file and only the first load can fail.
  it('shows a load error above the content', async () => {
    const store = fakeStore();
    store.failing.load = true;
    await settings.load();

    render(App);

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Could not load your settings');
    const content = screen.getByTestId('open-screen');
    expect(alert.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the logo, named Allies, and the name Allies', () => {
    render(App);
    const sidebar = screen.getByTestId('sidebar');
    const logo = screen.getByRole('img', { name: 'Allies' });
    expect(sidebar.contains(logo)).toBe(true);
    expect(sidebar.textContent).toContain('Allies');
  });

  it('holds search, the screens, Appearance and the theme button', () => {
    render(App);
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.contains(screen.getByTestId('search-box'))).toBe(true);
    for (const name of ['Dashboard', 'Contacts', 'Journal', 'Appearance', 'Switch to dark theme']) {
      expect(sidebar.contains(screen.getByRole('button', { name }))).toBe(true);
    }
  });

  it('switches Light to Dark with the theme button', async () => {
    fakeStore();
    await settings.setTheme('light');
    render(App);

    await fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toBeTruthy();
  });

  it('opens the Appearance screen from the footer', async () => {
    render(App);
    await fireEvent.click(screen.getByRole('button', { name: 'Appearance' }));
    expect(screen.getByTestId('screen-appearance')).toBeTruthy();
  });
});

describe('the shell', () => {
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

  it('keeps the search box when the user moves between the screens the sidebar offers', async () => {
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