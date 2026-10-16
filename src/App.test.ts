import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App.svelte';
import { navigation, open, openContact } from './lib/navigation.svelte';

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

  it('shows the contact screen when a contact is opened, and still has the search box', () => {
    openContact(7);
    render(App);
    expect(screen.getByTestId('screen-contact')).toBeTruthy();
    expect(screen.getByTestId('contact-id').textContent).toBe('Contact 7');
    expect(screen.getByTestId('search-box')).toBeTruthy();
  });
});