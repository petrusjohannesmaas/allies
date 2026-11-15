// The open screen and the open contact. Runes only work in a .svelte.ts file,
// which is why the shell's state lives here rather than in App.svelte.
export type Screen = 'dashboard' | 'contacts' | 'contact' | 'mission' | 'journal' | 'appearance';

export const navigation = $state({
  screen: 'dashboard' as Screen,
  contactId: null as number | null,
  missionId: null as number | null,
});

/** Every screen the sidebar's list can reach, in the order it shows them. The footer opens Appearance. */
export const screens: { screen: Screen; label: string }[] = [
  { screen: 'dashboard', label: 'Dashboard' },
  { screen: 'contacts', label: 'Contacts' },
  { screen: 'journal', label: 'Journal' },
];

export function open(screen: Screen) {
  navigation.screen = screen;
}

/** Opens a contact's page, which is the one screen the sidebar has no button for. */
export function openContact(contactId: number) {
  navigation.contactId = contactId;
  navigation.screen = 'contact';
}

export function goBackFromContact() {
  navigation.contactId = null;
  navigation.screen = 'contacts';
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
