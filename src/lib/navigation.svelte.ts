import type { SettingsSectionId } from '$lib/components/shell';

// The open screen and the open contact. Runes only work in a .svelte.ts file,
// which is why the shell's state lives here rather than in App.svelte.
//
// The sidebar reaches Home (the contacts), Missions, Interactions, Calendar
// and Settings. A contact opens from Home or the search box, and a mission
// opens from its contact's page.
export type Screen = 'home' | 'contact' | 'mission' | 'missions' | 'interactions' | 'calendar' | 'settings';

export const navigation = $state({
  screen: 'home' as Screen,
  contactId: null as number | null,
  missionId: null as number | null,
  settingsSection: 'appearance' as SettingsSectionId,
  /** Counts sidebar clicks. App re-opens the screen on each one. */
  visit: 0,
});

/**
 * A sidebar click. Every click counts as a visit, so opening the screen that
 * is already showing reloads it rather than leaving old data on screen.
 */
export function open(screen: Screen) {
  navigation.screen = screen;
  navigation.visit += 1;
  if (screen === 'settings') navigation.settingsSection = 'appearance';
}

/** Opens Settings on one section, as the profile menu does for Profile. */
export function openSettings(section: SettingsSectionId) {
  navigation.settingsSection = section;
  navigation.screen = 'settings';
}

/** Opens a contact's page, which is the one screen the sidebar has no button for. */
export function openContact(contactId: number) {
  navigation.contactId = contactId;
  navigation.screen = 'contact';
}

export function goBackFromContact() {
  navigation.contactId = null;
  navigation.screen = 'home';
}

/** Opens a mission's screen. It keeps the contact, so the way back needs no lookup. */
export function openMission(contactId: number, missionId: number) {
  navigation.contactId = contactId;
  navigation.missionId = missionId;
  navigation.screen = 'mission';
}

export function goBackFromMission() {
  navigation.missionId = null;
  navigation.screen = 'contact';
}
