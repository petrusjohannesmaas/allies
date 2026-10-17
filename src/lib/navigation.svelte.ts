// The open screen and the open contact. Runes only work in a .svelte.ts file,
// which is why the shell's state lives here rather than in App.svelte.
export type Screen = 'dashboard' | 'contacts' | 'contact' | 'journal';

export const navigation = $state({
  screen: 'dashboard' as Screen,
  contactId: null as number | null,
});

/** Every screen the top bar can reach, in the order it shows them. */
export const screens: { screen: Screen; label: string }[] = [
  { screen: 'dashboard', label: 'Dashboard' },
  { screen: 'contacts', label: 'Contacts' },
  { screen: 'journal', label: 'Journal' },
];

export function open(screen: Screen) {
  navigation.screen = screen;
}

/** Opens a contact's page, which is the one screen the top bar has no button for. */
export function openContact(contactId: number) {
  navigation.contactId = contactId;
  navigation.screen = 'contact';
}

export function goBackFromContact() {
  navigation.contactId = null;
  navigation.screen = 'contacts';
}