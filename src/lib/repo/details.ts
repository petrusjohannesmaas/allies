import type { Db } from '../db';

// Everything on this page sits on the contact row or in a table of its own, so
// each kind of detail is one table and one pair of functions.

export interface Phone {
  id: number;
  contact_id: number;
  label: string;
  number: string;
}

export interface Address {
  id: number;
  contact_id: number;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  is_home: number;
}

export interface Child {
  id: number;
  first_name: string;
  last_name: string | null;
}

export interface AddressInput {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

/* Phone numbers */

export async function listPhones(db: Db, contactId: number): Promise<Phone[]> {
  return db.select<Phone>('SELECT * FROM phone_numbers WHERE contact_id = $1 ORDER BY label COLLATE NOCASE, number', [
    contactId,
  ]);
}

export async function addPhone(db: Db, contactId: number, label: string, number: string): Promise<number> {
  const result = await db.execute('INSERT INTO phone_numbers (contact_id, label, number) VALUES ($1, $2, $3)', [
    contactId,
    label.trim(),
    number.trim(),
  ]);
  return result.lastInsertId;
}

export async function deletePhone(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM phone_numbers WHERE id = $1', [id]);
}

/* Addresses */

export async function listAddresses(db: Db, contactId: number): Promise<Address[]> {
  return db.select<Address>('SELECT * FROM addresses WHERE contact_id = $1 ORDER BY is_home DESC, id', [contactId]);
}

export async function addAddress(db: Db, contactId: number, input: AddressInput): Promise<number> {
  const result = await db.execute(
    'INSERT INTO addresses (contact_id, street, city, postal_code, country) VALUES ($1, $2, $3, $4, $5)',
    [contactId, blank(input.street), blank(input.city), blank(input.postalCode), blank(input.country)],
  );
  return result.lastInsertId;
}

/**
 * Makes one of a contact's addresses the home address and clears the flag on
 * the rest.
 *
 * Two statements, not the one `UPDATE ... SET is_home = (id = $1)` the index
 * would allow: SQLite checks the one-home-address index row by row as it
 * updates, so a single statement that moves the mark onto an earlier row
 * collides with the row it has not cleared yet. Each statement is on its own
 * atomic, which is all the app needs, because the plugin pools its connections
 * and a transaction across calls is not safe.
 */
export async function setHomeAddress(db: Db, contactId: number, addressId: number): Promise<void> {
  await db.execute('UPDATE addresses SET is_home = 0 WHERE contact_id = $1 AND is_home = 1', [contactId]);
  await db.execute('UPDATE addresses SET is_home = 1 WHERE id = $1', [addressId]);
}

export async function deleteAddress(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM addresses WHERE id = $1', [id]);
}

/** An address needs one part filled in. */
export function addressIsUsable(input: AddressInput): boolean {
  return [input.street, input.city, input.postalCode, input.country].some((part) => part.trim() !== '');
}

export function formatAddress(address: Address): string {
  const parts = [address.street, address.city, address.postal_code, address.country].filter(Boolean);
  return parts.join(', ');
}

/* Children */

export async function listChildren(db: Db, contactId: number): Promise<Child[]> {
  return db.select<Child>(
    `SELECT c.id, c.first_name, c.last_name
     FROM contact_children link
     JOIN contacts c ON c.id = link.child_id
     WHERE link.parent_id = $1
     ORDER BY c.first_name COLLATE NOCASE, c.last_name COLLATE NOCASE`,
    [contactId],
  );
}

export async function addChild(db: Db, parentId: number, childId: number): Promise<void> {
  await db.execute('INSERT INTO contact_children (parent_id, child_id) VALUES ($1, $2)', [parentId, childId]);
}

export async function removeChild(db: Db, parentId: number, childId: number): Promise<void> {
  await db.execute('DELETE FROM contact_children WHERE parent_id = $1 AND child_id = $2', [parentId, childId]);
}

/* Tags */

export async function listTags(db: Db, contactId: number): Promise<string[]> {
  const rows = await db.select<{ tag: string }>('SELECT tag FROM contact_tags WHERE contact_id = $1 ORDER BY tag COLLATE NOCASE', [
    contactId,
  ]);
  return rows.map((row) => row.tag);
}

/** Adding a tag twice is refused by the primary key, so a repeat is not an error. */
export async function addTag(db: Db, contactId: number, tag: string): Promise<void> {
  await db.execute('INSERT OR IGNORE INTO contact_tags (contact_id, tag) VALUES ($1, $2)', [contactId, tag.trim()]);
}

export async function removeTag(db: Db, contactId: number, tag: string): Promise<void> {
  await db.execute('DELETE FROM contact_tags WHERE contact_id = $1 AND tag = $2', [contactId, tag]);
}

/* The significant other and the three text fields on the contact row */

export async function getSignificantOther(db: Db, contactId: number): Promise<Child | null> {
  const rows = await db.select<Child>(
    `SELECT c.id, c.first_name, c.last_name
     FROM contacts parent
     JOIN contacts c ON c.id = parent.significant_other_id
     WHERE parent.id = $1`,
    [contactId],
  );
  return rows[0] ?? null;
}

export async function setSignificantOther(db: Db, contactId: number, otherId: number | null): Promise<void> {
  await db.execute('UPDATE contacts SET significant_other_id = $1 WHERE id = $2', [otherId, contactId]);
}

export interface ProfileText {
  how_met: string | null;
  work: string | null;
  food_preferences: string | null;
}

export async function getProfileText(db: Db, contactId: number): Promise<ProfileText> {
  const rows = await db.select<ProfileText>(
    'SELECT how_met, work, food_preferences FROM contacts WHERE id = $1',
    [contactId],
  );
  return rows[0] ?? { how_met: null, work: null, food_preferences: null };
}

export async function setProfileText(db: Db, contactId: number, text: ProfileText): Promise<void> {
  await db.execute('UPDATE contacts SET how_met = $1, work = $2, food_preferences = $3 WHERE id = $4', [
    blank(text.how_met ?? ''),
    blank(text.work ?? ''),
    blank(text.food_preferences ?? ''),
    contactId,
  ]);
}

function blank(value: string): string | null {
  const cleaned = value.trim();
  return cleaned === '' ? null : cleaned;
}