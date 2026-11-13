import type { Db } from '../db';

// Everything on this page sits on the contact row or in a table of its own, so
// each kind of detail is one table and one pair of functions.

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

async function listChildren(db: Db, contactId: number): Promise<Child[]> {
  return db.select<Child>(
    `SELECT c.id, c.first_name, c.last_name
     FROM contact_children link
     JOIN contacts c ON c.id = link.child_id
     WHERE link.parent_id = $1
     ORDER BY c.first_name COLLATE NOCASE, c.last_name COLLATE NOCASE`,
    [contactId],
  );
}

/* Tags */

export async function listTags(db: Db, contactId: number): Promise<string[]> {
  const rows = await db.select<{ tag: string }>('SELECT tag FROM contact_tags WHERE contact_id = $1 ORDER BY tag COLLATE NOCASE', [
    contactId,
  ]);
  return rows.map((row) => row.tag);
}

/* About: the significant other, the children and the three text fields on the contact row */

async function getSignificantOther(db: Db, contactId: number): Promise<Child | null> {
  const rows = await db.select<Child>(
    `SELECT c.id, c.first_name, c.last_name
     FROM contacts parent
     JOIN contacts c ON c.id = parent.significant_other_id
     WHERE parent.id = $1`,
    [contactId],
  );
  return rows[0] ?? null;
}

interface ProfileText {
  how_met: string | null;
  work: string | null;
  food_preferences: string | null;
}

async function getProfileText(db: Db, contactId: number): Promise<ProfileText> {
  const rows = await db.select<ProfileText>(
    'SELECT how_met, work, food_preferences FROM contacts WHERE id = $1',
    [contactId],
  );
  return rows[0] ?? { how_met: null, work: null, food_preferences: null };
}

export interface About {
  significant_other: Child | null;
  children: Child[];
  how_met: string | null;
  work: string | null;
  food_preferences: string | null;
}

export interface AboutInput {
  significantOtherId: number | null;
  childIds: number[];
  howMet: string;
  work: string;
  foodPreferences: string;
}

export async function getAbout(db: Db, contactId: number): Promise<About> {
  const text = await getProfileText(db, contactId);
  return {
    significant_other: await getSignificantOther(db, contactId),
    children: await listChildren(db, contactId),
    ...text,
  };
}

/** Saves the significant other, the children and the three text fields in one statement. */
export async function saveAbout(db: Db, contactId: number, input: AboutInput): Promise<void> {
  await db.execute(
    `UPDATE contact_about
        SET significant_other_id = $1, how_met = $2, work = $3, food_preferences = $4, children = $5
      WHERE id = $6`,
    [
      input.significantOtherId,
      blank(input.howMet),
      blank(input.work),
      blank(input.foodPreferences),
      JSON.stringify([...new Set(input.childIds)]),
      contactId,
    ],
  );
}

function blank(value: string): string | null {
  const cleaned = value.trim();
  return cleaned === '' ? null : cleaned;
}