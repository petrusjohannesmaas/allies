// Home remembers which contact its panel shows until the app closes, also
// while another screen is open.
export const home = $state({ selectedId: null as number | null });

export interface HomeView<T> {
  selected: T | null;
  rows: T[];
  page: number;
  pages: number;
}

export function homeView<T extends { id: number }>(
  contacts: T[],
  selectedId: number | null,
  { random = Math.random }: { random?: () => number } = {},
): HomeView<T> {
  const remembered = contacts.find((contact) => contact.id === selectedId);
  const picked = contacts.length === 0 ? null : contacts[Math.floor(random() * contacts.length)];
  return { selected: remembered ?? picked, rows: contacts, page: 1, pages: 1 };
}
