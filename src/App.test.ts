import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App.svelte';
import { db } from './lib/db';
import { home } from './lib/home.svelte';
import { navigation, openContact } from './lib/navigation.svelte';
import { addContact, blankInput } from './lib/repo/contacts';
import { settings } from './lib/settings.svelte';
import { fakeStore } from './test/fake-store';

beforeEach(() => {
  navigation.screen = 'home';
  navigation.contactId = null;
  home.selectedId = null;
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

  it('shows the logo, named Allies, without the name as text', () => {
    render(App);
    const sidebar = screen.getByTestId('sidebar');
    const logo = screen.getByRole('img', { name: 'Allies' });
    expect(sidebar.contains(logo)).toBe(true);
    expect(sidebar.textContent).not.toContain('Allies');
  });

  it('holds Home, Missions, Interactions, Calendar, Settings and a disabled Log out', () => {
    render(App);
    const sidebar = screen.getByTestId('sidebar');
    const labels = Array.from(sidebar.querySelectorAll('button'), (button) => button.getAttribute('aria-label'));
    expect(labels).toEqual(['Home', 'Missions', 'Interactions', 'Calendar', 'Settings', 'Log out']);
    expect(screen.getByRole('button', { name: 'Log out' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('switches Light to Dark with the theme button in the Home header', async () => {
    fakeStore();
    await settings.setTheme('light');
    render(App);

    const header = screen.getByTestId('home-header');
    await fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(header.contains(screen.getByRole('button', { name: 'Switch to light theme' }))).toBe(true);
  });

  it('opens Settings on Appearance, with Email as its own section', async () => {
    render(App);
    await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByTestId('screen-appearance')).toBeTruthy();
    expect(screen.getByTestId('settings-tab-unique').textContent?.trim()).toBe('Email');
  });

  it('shows the logo credit under Info', async () => {
    render(App);
    await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await fireEvent.click(screen.getByTestId('settings-tab-info'));
    expect(screen.getByTestId('logo-attribution').textContent).toContain('Flaticon');
  });
});

describe('the shell', () => {
  it('opens on Home, the contacts list, with the search box in the header', async () => {
    render(App);
    expect(screen.getByTestId('screen-home')).toBeTruthy();
    expect(await screen.findByTestId('contact-panel-empty')).toBeTruthy();
    expect(screen.getByTestId('home-header').contains(screen.getByTestId('search-box'))).toBe(true);
    expect(screen.getByTestId('notifications')).toBeTruthy();
  });

  it.each([
    ['missions', 'screen-missions'],
    ['interactions', 'screen-journal'],
    ['calendar', 'screen-calendar'],
  ] as const)('opens %s from the sidebar', async (id, testId) => {
    render(App);
    await fireEvent.click(screen.getByTestId(`sidebar-${id}`));
    expect(screen.getByTestId(testId)).toBeTruthy();
    expect(screen.getByTestId(`sidebar-${id}`).getAttribute('aria-current')).toBe('page');
  });

  it('shows the contact screen when a contact is opened, with Home marked in the sidebar', async () => {
    const connection = await db();
    const id = await addContact(connection, { ...blankInput(), firstName: 'Ada' });

    openContact(id);
    render(App);

    await waitFor(() => expect(screen.getByTestId('contact-name').textContent).toBe('Ada'));
    expect(screen.getByTestId('sidebar-home').getAttribute('aria-current')).toBe('page');
  });

  it('reloads Home when its sidebar button is pressed again', async () => {
    await (await db()).execute('DELETE FROM contacts');
    render(App);
    await waitFor(() => expect(screen.getByTestId('contacts-empty')).toBeTruthy());

    await addContact(await db(), { ...blankInput(), firstName: 'Ada' });
    await fireEvent.click(screen.getByTestId('sidebar-home'));

    await waitFor(() => expect(screen.getByTestId('contacts-list').textContent).toContain('Ada'));
  });

  it('Home keeps the selected contact when its sidebar button is pressed again', async () => {
    const connection = await db();
    await connection.execute('DELETE FROM contacts');
    await addContact(connection, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
    await addContact(connection, { ...blankInput(), firstName: 'Grace', lastName: 'Hopper' });

    render(App);
    await waitFor(() => expect(screen.getAllByTestId('contact-row')).toHaveLength(2));
    const grace = screen.getAllByTestId('contact-row').find((row) => row.getAttribute('data-contact-name') === 'Grace Hopper')!;
    await fireEvent.click(grace);
    await waitFor(() => expect(screen.getByTestId('panel-name').textContent).toBe('Grace Hopper'));

    await fireEvent.click(screen.getByTestId('sidebar-home'));

    await waitFor(() => expect(screen.getAllByTestId('contact-row')).toHaveLength(2));
    await waitFor(() => expect(screen.getByTestId('panel-name').textContent).toBe('Grace Hopper'));
  });

  it('says so when the contact is gone', async () => {
    openContact(999);
    render(App);
    await waitFor(() => expect(screen.getByTestId('contact-missing')).toBeTruthy());
  });
});
