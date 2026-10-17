import type { Db } from '../db';

/** The journal is read from the view, so calls and activities appear without a stored copy. */

export type JournalKind = 'entry' | 'rating' | 'activity' | 'call';

export interface JournalRow {
  kind: JournalKind;
  source_id: number | null;
  day: string;
  body: string | null;
  face: number | null;
  contact_id: number | null;
  contact_name: string | null;
}

/** Newest day first, and inside a day the kinds in a fixed order. */
export async function listJournal(db: Db): Promise<JournalRow[]> {
  return db.select<JournalRow>(
    `SELECT j.kind, j.source_id, j.day, j.body, j.face, j.contact_id,
            CASE WHEN c.id IS NULL THEN NULL
                 ELSE TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')) END AS contact_name
     FROM journal j LEFT JOIN contacts c ON c.id = j.contact_id
     ORDER BY j.day DESC, j.kind, j.source_id`,
  );
}

export async function addEntry(db: Db, entryDate: string, body: string): Promise<number> {
  const result = await db.execute('INSERT INTO journal_entries (entry_date, body) VALUES ($1, $2)', [
    entryDate,
    body.trim(),
  ]);
  return result.lastInsertId;
}

/** Only what the user wrote is in journal_entries, so only that can be deleted from the journal. */
export async function deleteEntry(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM journal_entries WHERE id = $1', [id]);
}

/** The faces a day may be given, from sad to happy. */
export const FACES = [1, 2, 3] as const;

/** A day takes one rating: the second insert is refused by the primary key. */
export async function rateDay(db: Db, day: string, face: number): Promise<void> {
  await db.execute('INSERT INTO day_ratings (day, face) VALUES ($1, $2)', [day, face]);
}

export async function getRating(db: Db, day: string): Promise<number | null> {
  const rows = await db.select<{ face: number }>('SELECT face FROM day_ratings WHERE day = $1', [day]);
  return rows[0]?.face ?? null;
}
