import type { Db } from '../db';

/** The dates the user wants to remember, one row each. Reminders never leave the app. */

export interface Reminder {
  id: number;
  contact_id: number;
  remind_on: string;
  description: string;
  repeats_yearly: number;
}

/** The soonest reminder first, because that is the one coming up. */
export async function listReminders(db: Db, contactId: number): Promise<Reminder[]> {
  return db.select<Reminder>('SELECT * FROM reminders WHERE contact_id = $1 ORDER BY remind_on, id', [contactId]);
}

export async function addReminder(
  db: Db,
  contactId: number,
  remindOn: string,
  description: string,
  repeatsYearly: boolean,
): Promise<number> {
  const result = await db.execute(
    'INSERT INTO reminders (contact_id, remind_on, description, repeats_yearly) VALUES ($1, $2, $3, $4)',
    [contactId, remindOn, description.trim(), repeatsYearly ? 1 : 0],
  );
  return result.lastInsertId;
}

export async function deleteReminder(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM reminders WHERE id = $1', [id]);
}
