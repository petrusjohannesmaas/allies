import type { Birthday, DatedReminder } from '../dates';
import type { Db } from '../db';

/** The four things the dashboard reads. Each is one query, since a pooled call cannot share a transaction. */

/** Every contact that has a birthday, with the name the lists show. */
export async function listBirthdays(db: Db): Promise<Birthday[]> {
  const rows = await db.select<{ id: number; first_name: string; last_name: string | null; birthday: string }>(
    `SELECT id, first_name, last_name, birthday FROM contacts
     WHERE birthday IS NOT NULL ORDER BY first_name COLLATE NOCASE`,
  );
  return rows.map((row) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(' '),
    birthday: row.birthday,
  }));
}

/** Every reminder, with the name of the contact it belongs to. */
export async function listDatedReminders(db: Db): Promise<DatedReminder[]> {
  const rows = await db.select<{
    contact_id: number;
    first_name: string;
    last_name: string | null;
    remind_on: string;
    description: string;
    repeats_yearly: number;
  }>(
    `SELECT r.contact_id, c.first_name, c.last_name, r.remind_on, r.description, r.repeats_yearly
     FROM reminders r JOIN contacts c ON c.id = r.contact_id
     ORDER BY r.remind_on, r.id`,
  );
  return rows.map((row) => ({
    contactId: row.contact_id,
    contactName: [row.first_name, row.last_name].filter(Boolean).join(' '),
    remindOn: row.remind_on,
    description: row.description,
    repeatsYearly: row.repeats_yearly === 1,
  }));
}

export interface RecentContact {
  id: number;
  name: string;
  lastViewedAt: string;
}

/** The eight contacts the user opened most recently. A contact never opened is not among them. */
export async function listRecentlyViewed(db: Db): Promise<RecentContact[]> {
  const rows = await db.select<{ id: number; first_name: string; last_name: string | null; last_viewed_at: string }>(
    `SELECT id, first_name, last_name, last_viewed_at FROM contacts
     WHERE last_viewed_at IS NOT NULL ORDER BY last_viewed_at DESC, id DESC LIMIT 8`,
  );
  return rows.map((row) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(' '),
    lastViewedAt: row.last_viewed_at,
  }));
}

/** Calls and activities as one number, the way the dashboard shows them. */
export async function countCallsAndActivities(db: Db): Promise<number> {
  const rows = await db.select<{ n: number }>(
    'SELECT (SELECT COUNT(*) FROM calls) + (SELECT COUNT(*) FROM activities) AS n',
  );
  return rows[0].n;
}
