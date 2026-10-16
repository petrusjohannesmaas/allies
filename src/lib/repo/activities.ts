import { isActivityCategory } from '../activity-categories';
import type { Db } from '../db';

/** What the user did with a contact, one row each. */

export interface Activity {
  id: number;
  contact_id: number;
  category: string;
  happened_on: string;
  description: string;
}

/** The newest activity first, and the later of two on one day before the earlier. */
export async function listActivities(db: Db, contactId: number): Promise<Activity[]> {
  return db.select<Activity>(
    'SELECT * FROM activities WHERE contact_id = $1 ORDER BY happened_on DESC, id DESC',
    [contactId],
  );
}

/** The category has to be one the picker offers, so nothing else reaches the table. */
export async function addActivity(
  db: Db,
  contactId: number,
  category: string,
  happenedOn: string,
  description: string,
): Promise<number> {
  if (!isActivityCategory(category)) throw new Error(`"${category}" is not an activity category`);
  const result = await db.execute(
    'INSERT INTO activities (contact_id, category, happened_on, description) VALUES ($1, $2, $3, $4)',
    [contactId, category, happenedOn, description.trim()],
  );
  return result.lastInsertId;
}

export async function deleteActivity(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM activities WHERE id = $1', [id]);
}

/** The date of the most recent activity, or null when nothing was logged. */
export async function lastActivityTogether(db: Db, contactId: number): Promise<string | null> {
  const rows = await db.select<{ last: string | null }>(
    'SELECT MAX(happened_on) AS last FROM activities WHERE contact_id = $1',
    [contactId],
  );
  return rows[0].last;
}
