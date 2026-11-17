import type { Component } from 'svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ShellIcon = Component<any>;

/** One button in the sidebar. `dot` puts a small accent dot on the icon. */
export type NavItem = {
  id: string;
  label: string;
  icon: ShellIcon;
  dot?: boolean;
};

/** The settings sections, in the order the tabs show them. `unique` is the app's own setting. */
export type SettingsSectionId = 'appearance' | 'unique' | 'info' | 'profile' | 'data';

/** What the header's profile menu shows. `photoUrl` is null when there is no picture. */
export type ShellProfile = {
  name: string;
  subtitle: string;
  photoUrl: string | null;
};

/** The logo credit from an app's logo-attribution.txt. */
export type Attribution = {
  text: string;
  url: string;
};
