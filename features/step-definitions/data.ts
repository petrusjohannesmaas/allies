import { existsSync, rmSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { configDir } from './app';

export const DATABASE_PATH = join(configDir(), 'allies.db');

/** Where the app keeps contact pictures, which the fs plugin scopes to. */
export const PICTURES_PATH = join(configDir(), 'pictures');

// A step may read or write the database while the app has it open, which is
// how a scenario sets up what it needs and checks what was saved.
export function withDatabase<T>(work: (db: DatabaseSync) => T): T {
  const db = new DatabaseSync(DATABASE_PATH);
  try {
    db.exec('PRAGMA foreign_keys = ON;');
    return work(db);
  } finally {
    db.close();
  }
}

/** Every table the app owns, emptied of its rows. The journal view holds nothing of its own. */
const TABLES = [
  'day_ratings',
  'journal_entries',
  'activities',
  'calls',
  'reminders',
  'missions',
  'contact_tags',
  'contact_children',
  'addresses',
  'phone_numbers',
  'notes',
  'contacts',
];

export function emptyDatabase(): void {
  withDatabase((db) => {
    db.exec('PRAGMA foreign_keys = OFF;');
    for (const table of TABLES) db.exec(`DELETE FROM "${table}";`);
  });
  rmSync(PICTURES_PATH, { recursive: true, force: true });
}

export function pictureFiles(): string[] {
  if (!existsSync(PICTURES_PATH)) return [];
  return readdirSync(PICTURES_PATH).sort();
}

export function insertContact(fields: {
  category?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  birthday?: string;
  picture?: string;
  lastViewedAt?: string;
}): number {
  return withDatabase((db) => {
    const result = db
      .prepare(
        `INSERT INTO contacts (category, first_name, last_name, email, birthday, picture, last_viewed_at)
         VALUES ($category, $first, $last, $email, $birthday, $picture, $viewed)`,
      )
      .run({
        $category: fields.category ?? 'friend',
        $first: fields.firstName,
        $last: fields.lastName ?? null,
        $email: fields.email ?? null,
        $birthday: fields.birthday ?? null,
        $picture: fields.picture ?? null,
        $viewed: fields.lastViewedAt ?? null,
      });
    return Number(result.lastInsertRowid);
  });
}

export function countRows(table: string): number {
  return withDatabase((db) => (db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get() as { n: number }).n);
}

/** The id of the contact whose name reads as `name`, which is how the list shows it. */
export function findContactId(name: string): number | undefined {
  return withDatabase((db) => {
    const row = db
      .prepare(`SELECT id FROM contacts WHERE TRIM(first_name || ' ' || COALESCE(last_name, '')) = $name`)
      .get({ $name: name }) as { id: number } | undefined;
    return row?.id;
  });
}

/** One column of one contact, found by the name the list shows. */
export function contactValue(
  name: string,
  column: 'category' | 'email' | 'birthday' | 'picture' | 'last_viewed_at',
): unknown {
  const id = findContactId(name);
  if (id === undefined) return undefined;
  return withDatabase(
    (db) => (db.prepare(`SELECT ${column} FROM contacts WHERE id = $id`).get({ $id: id }) as Record<string, unknown>)[column],
  );
}