import type { Db } from '../db';

/** The phone calls a contact has had, one row each. */

export interface Call {
  id: number;
  contact_id: number;
  called_on: string;
  description: string;
}

/** The newest call first, and the later of two calls on one day before the earlier. */
export async function listCalls(db: Db, contactId: number): Promise<Call[]> {
  return db.select<Call>('SELECT * FROM calls WHERE contact_id = $1 ORDER BY called_on DESC, id DESC', [contactId]);
}

export async function addCall(db: Db, contactId: number, calledOn: string, description: string): Promise<number> {
  const result = await db.execute('INSERT INTO calls (contact_id, called_on, description) VALUES ($1, $2, $3)', [
    contactId,
    calledOn,
    description.trim(),
  ]);
  return result.lastInsertId;
}

export async function deleteCall(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM calls WHERE id = $1', [id]);
}

/** The date of the most recent call, or null when the contact was never called. */
export async function lastCalled(db: Db, contactId: number): Promise<string | null> {
  const rows = await db.select<{ last: string | null }>('SELECT MAX(called_on) AS last FROM calls WHERE contact_id = $1', [
    contactId,
  ]);
  return rows[0].last;
}
