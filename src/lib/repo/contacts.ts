import type { Db } from '../db';
import type { Category } from '../categories';
import { deletePicture, pictureStore, savePicture } from './pictures';

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

/** What the contact form hands back: the fields, and a picture only when the user picked a new one. */
export interface ContactFormResult {
  input: ContactInput;
  picture: { type: string; bytes: Uint8Array } | null;
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

/** Points the contact row at a picture, or takes the picture away. */
export async function setPicture(db: Db, id: number, picture: string | null): Promise<void> {
  await db.execute('UPDATE contacts SET picture = $1 WHERE id = $2', [picture, id]);
}

/**
 * Adds a contact and gives it the picture the user picked. The file name needs
 * the new contact's id, so the row is written first, then the file, then the
 * row's picture column. A file that cannot be written leaves the contact there
 * without a picture, which the user can pick again.
 */
export async function addContactWithPicture(
  db: Db,
  input: ContactInput,
  picture: { type: string; bytes: Uint8Array } | null,
): Promise<number> {
  const id = await addContact(db, input);
  if (!picture) return id;

  const name = await savePicture(pictureStore, id, { name: '', type: picture.type, bytes: picture.bytes }, null, new Date());
  await setPicture(db, id, name);
  return id;
}

/** Changes a contact's fields and, when a new picture was picked, its picture. */
export async function updateContactWithPicture(
  db: Db,
  contact: Contact,
  input: ContactInput,
  picture: { type: string; bytes: Uint8Array } | null,
): Promise<void> {
  await updateContact(db, contact.id, input);
  if (!picture) return;

  const name = await savePicture(pictureStore, contact.id, { name: '', type: picture.type, bytes: picture.bytes }, contact.picture, new Date());
  await setPicture(db, contact.id, name);
}

/** Removes the contact, and then its picture file. */
export async function deleteContact(db: Db, contact: Contact): Promise<void> {
  await db.execute('DELETE FROM contacts WHERE id = $1', [contact.id]);
  await deletePicture(pictureStore, contact.picture);
}

/** Records that the user opened this contact, which is what the dashboard's recently viewed list reads. */
export async function markViewed(db: Db, id: number): Promise<void> {
  await db.execute("UPDATE contacts SET last_viewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = $1", [id]);
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