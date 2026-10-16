import type { Db } from '../db';
import type { Category } from '../categories';

/** A contact as the contacts table holds it. */
export interface Contact {
  id: number;
  category: Category;
  first_name: string;
  last_name: string | null;
  email: string | null;
  birthday: string | null;
  picture: string | null;
  last_viewed_at: string | null;
  created_at: string;
}

/** What the form collects. An empty field is stored as null, not as ''. */
export interface ContactInput {
  category: Category;
  firstName: string;
  lastName: string;
  email: string;
  birthday: string;
}

export function blankInput(): ContactInput {
  return { category: 'friend', firstName: '', lastName: '', email: '', birthday: '' };
}

export function toInput(contact: Contact): ContactInput {
  return {
    category: contact.category,
    firstName: contact.first_name,
    lastName: contact.last_name ?? '',
    email: contact.email ?? '',
    birthday: contact.birthday ?? '',
  };
}

/** What the list and the contact page need: the name as one string. */
export function fullName(contact: Pick<Contact, 'first_name' | 'last_name'>): string {
  return [contact.first_name, contact.last_name].filter(Boolean).join(' ');
}

const COLUMNS = 'id, category, first_name, last_name, email, birthday, picture, last_viewed_at, created_at';

// A contact known by one name sorts under that name, so the list reads the way
// the user wrote it down.
const ORDER = `ORDER BY COALESCE(NULLIF(last_name, ''), first_name) COLLATE NOCASE, first_name COLLATE NOCASE, id`;

/** Every contact, by last name and then first name. */
export async function listContacts(db: Db): Promise<Contact[]> {
  return db.select<Contact>(`SELECT ${COLUMNS} FROM contacts ${ORDER}`);
}

export async function getContact(db: Db, id: number): Promise<Contact | null> {
  const rows = await db.select<Contact>(`SELECT ${COLUMNS} FROM contacts WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function addContact(db: Db, input: ContactInput): Promise<number> {
  const result = await db.execute(
    'INSERT INTO contacts (category, first_name, last_name, email, birthday) VALUES ($1, $2, $3, $4, $5)',
    [input.category, trimmed(input.firstName), empty(input.lastName), empty(input.email), empty(input.birthday)],
  );
  return result.lastInsertId;
}

export async function updateContact(db: Db, id: number, input: ContactInput): Promise<void> {
  await db.execute(
    'UPDATE contacts SET category = $1, first_name = $2, last_name = $3, email = $4, birthday = $5 WHERE id = $6',
    [input.category, trimmed(input.firstName), empty(input.lastName), empty(input.email), empty(input.birthday), id],
  );
}

export async function deleteContact(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM contacts WHERE id = $1', [id]);
}

/** The number of contacts the dashboard counts. */
export async function countContacts(db: Db): Promise<number> {
  const rows = await db.select<{ n: number }>('SELECT COUNT(*) AS n FROM contacts');
  return rows[0].n;
}

function trimmed(value: string): string {
  return value.trim();
}

/** An empty field becomes null, so the database holds no blank strings. */
function empty(value: string): string | null {
  const cleaned = value.trim();
  return cleaned === '' ? null : cleaned;
}