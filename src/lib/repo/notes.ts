import type { Db } from '../db';

/** A note as the notes table holds it. */
export interface Note {
  id: number;
  contact_id: number;
  body: string;
  is_favourite: number;
  created_at: string;
  updated_at: string;
}

// Newest first, and the id breaks a tie so two notes written in the same
// millisecond keep a fixed order.
const ORDER = 'ORDER BY created_at DESC, id DESC';

export async function listNotes(db: Db, contactId: number): Promise<Note[]> {
  return db.select<Note>(`SELECT * FROM notes WHERE contact_id = $1 ${ORDER}`, [contactId]);
}

export async function addNote(db: Db, contactId: number, body: string): Promise<number> {
  const result = await db.execute('INSERT INTO notes (contact_id, body) VALUES ($1, $2)', [contactId, body]);
  return result.lastInsertId;
}

export async function updateNote(db: Db, id: number, body: string): Promise<void> {
  await db.execute(
    "UPDATE notes SET body = $1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = $2",
    [body, id],
  );
}

export async function setNoteFavourite(db: Db, id: number, favourite: boolean): Promise<void> {
  await db.execute('UPDATE notes SET is_favourite = $1 WHERE id = $2', [favourite ? 1 : 0, id]);
}

export async function deleteNote(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM notes WHERE id = $1', [id]);
}

/** Notes are read-only once their body is empty, so an empty note is never saved. */
export function noteBodyIsUsable(body: string): boolean {
  return body.trim() !== '';
}