import { fireEvent, render, screen } from '@testing-library/svelte';
import { House, Star } from '@lucide/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import AppShell from './AppShell.svelte';
import HomeHeader from './HomeHeader.svelte';
import SettingsShell from './SettingsShell.svelte';
import { initials, parseAttribution } from './attribution';

// bits-ui measures the popover with ResizeObserver, which jsdom lacks.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const text = (value: string) => createRawSnippet(() => ({ render: () => `<p>${value}</p>` }));

function renderShell(current = 'home', onnavigate = vi.fn()) {
  render(AppShell, {
    logo: '/logo.png',
    appName: 'Test app',
    home: { id: 'home', label: 'Home', icon: House },
    features: [
      { id: 'one', label: 'One', icon: Star },
      { id: 'two', label: 'Two', icon: Star, dot: true },
      { id: 'three', label: 'Three', icon: Star },
    ],
    current,
    onnavigate,
    children: text('Page content'),
  });
  return onnavigate;
}

describe('AppShell', () => {
  it('shows the logo, Home, the three features, Settings and Log out, in that order', () => {
    renderShell();
    expect(screen.getByTestId('sidebar-logo').getAttribute('alt')).toBe('Test app');
    const labels = Array.from(screen.getByTestId('sidebar').querySelectorAll('button'), (button) =>
      button.getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Home', 'One', 'Two', 'Three', 'Settings', 'Log out']);
    expect(screen.getByText('Page content')).toBeTruthy();
  });

  it('marks the open page and reports clicks by id', async () => {
    const onnavigate = renderShell('two');
    expect(screen.getByTestId('sidebar-two').getAttribute('aria-current')).toBe('page');
    expect(screen.getByTestId('sidebar-home').getAttribute('aria-current')).toBeNull();
    await fireEvent.click(screen.getByTestId('sidebar-three'));
    await fireEvent.click(screen.getByTestId('sidebar-settings'));
    expect(onnavigate.mock.calls).toEqual([['three'], ['settings']]);
  });

  it('shows a dot on a feature that asks for one', () => {
    renderShell();
    expect(screen.getByTestId('sidebar-two-dot')).toBeTruthy();
    expect(screen.queryByTestId('sidebar-one-dot')).toBeNull();
  });

  it('keeps Log out disabled', async () => {
    const onnavigate = renderShell();
    const logout = screen.getByTestId('sidebar-logout');
    expect(logout.getAttribute('aria-disabled')).toBe('true');
    await fireEvent.click(logout);
    expect(onnavigate).not.toHaveBeenCalled();
  });
});

describe('HomeHeader', () => {
  const profile = { name: 'Ada Lovelace', subtitle: 'Notes', photoUrl: null };

  it('shows the title, the special icon, the theme toggle and the profile menu', () => {
    render(HomeHeader, {
      dark: true,
      ontoggletheme: () => {},
      profile,
      onopenprofile: () => {},
      special: createRawSnippet(() => ({ render: () => '<button data-testid="special">S</button>' })),
    });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Home');
    const icons = screen.getByTestId('home-header-icons');
    expect(icons.children[0].getAttribute('data-testid')).toBe('special');
    expect(screen.getByTestId('theme-toggle').getAttribute('aria-label')).toBe('Switch to light theme');
    expect(screen.getByTestId('profile-initials').textContent?.trim()).toBe('AL');
  });

  it('toggles the theme', async () => {
    const ontoggletheme = vi.fn();
    render(HomeHeader, { dark: false, ontoggletheme, profile, onopenprofile: () => {} });
    expect(screen.getByTestId('theme-toggle').getAttribute('aria-label')).toBe('Switch to dark theme');
    await fireEvent.click(screen.getByTestId('theme-toggle'));
    expect(ontoggletheme).toHaveBeenCalledOnce();
  });

  it('opens the profile card and its button opens Settings, Profile', async () => {
    const onopenprofile = vi.fn();
    render(HomeHeader, { dark: true, ontoggletheme: () => {}, profile, onopenprofile });
    await fireEvent.click(screen.getByTestId('profile-menu'));
    expect((await screen.findByTestId('profile-name')).textContent).toBe('Ada Lovelace');
    expect(screen.getByTestId('profile-subtitle').textContent).toBe('Notes');
    await fireEvent.click(screen.getByTestId('profile-edit'));
    expect(onopenprofile).toHaveBeenCalledOnce();
  });
});

describe('SettingsShell', () => {
  const sections = {
    appearance: text('Appearance body'),
    unique: text('Unique body'),
    info: text('Info body'),
    profile: text('Profile body'),
    data: text('Data body'),
  };

  it('shows the five tabs in order, with the app naming its own one', () => {
    render(SettingsShell, { uniqueLabel: 'Email', ...sections });
    const tabs = Array.from(
      screen.getByRole('navigation', { name: 'Settings sections' }).querySelectorAll('button'),
      (tab) => tab.textContent?.trim(),
    );
    expect(tabs).toEqual(['Appearance', 'Email', 'Info', 'Profile', 'Data']);
    expect(screen.getByText('Appearance body')).toBeTruthy();
  });

  it('opens a section from its tab, or from the section prop', async () => {
    render(SettingsShell, { uniqueLabel: 'Email', section: 'profile', ...sections });
    expect(screen.getByText('Profile body')).toBeTruthy();
    await fireEvent.click(screen.getByTestId('settings-tab-info'));
    expect(screen.getByText('Info body')).toBeTruthy();
    expect(screen.getByTestId('settings-tab-info').getAttribute('aria-current')).toBe('page');
  });
});

describe('parseAttribution', () => {
  it('reads the text and address out of a Flaticon anchor', () => {
    expect(
      parseAttribution(
        '<a href="https://www.flaticon.com/free-icons/wallet" title="wallet icons">Wallet icons created by Magnific - Flaticon</a>\n',
      ),
    ).toEqual({ text: 'Wallet icons created by Magnific - Flaticon', url: 'https://www.flaticon.com/free-icons/wallet' });
  });

  it('keeps plain text with no address', () => {
    expect(parseAttribution(' Made in house \n')).toEqual({ text: 'Made in house', url: '' });
  });
});

describe('initials', () => {
  it('takes the first and last name', () => {
    expect(initials('Ada King Lovelace')).toBe('AL');
    expect(initials('Ada')).toBe('A');
    expect(initials('  ')).toBe('');
  });
});
