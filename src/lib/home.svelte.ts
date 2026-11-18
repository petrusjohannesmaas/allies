// Home remembers which contact its panel shows until the app closes, also
// while another screen is open.
export const home = $state({ selectedId: null as number | null });

export const ROW_HEIGHT = 56;

export interface HomeView<T> {
  selected: T | null;
  rows: T[];
  page: number;
  pages: number;
  perPage: number;
}

interface HomeOptions {
  random?: () => number;
  /** The height in pixels of the space the rows fill. Infinity keeps one page. */
  listHeight?: number;
  /** The page asked for, or null for the page that holds the selected contact. */
  page?: number | null;
}

export function homeView<T extends { id: number }>(
  contacts: T[],
  selectedId: number | null,
  { random = Math.random, listHeight = Infinity, page = null }: HomeOptions = {},
): HomeView<T> {
  const remembered = contacts.find((contact) => contact.id === selectedId);
  const picked = contacts.length === 0 ? null : contacts[Math.floor(random() * contacts.length)];
  const selected = remembered ?? picked;

  const perPage = Math.max(1, Math.floor(listHeight / ROW_HEIGHT));
  const pages = Math.max(1, Math.ceil(contacts.length / perPage));
  const holding = selected === null ? 0 : Math.floor(contacts.indexOf(selected) / perPage) + 1;
  const current = Math.min(pages, Math.max(1, page ?? holding));
  const rows = contacts.slice((current - 1) * perPage, current * perPage);
  return { selected, rows, page: current, pages, perPage };
}
