import type { Db } from '../db';

/** A mission as the missions table holds it. */
export interface Mission {
  id: number;
  contact_id: number;
  description: string;
  due_date: string | null;
}

/** Soonest due date first, and a mission with no date last. */
const ORDER = 'ORDER BY due_date IS NULL, due_date, id';

export async function listMissions(db: Db, contactId: number): Promise<Mission[]> {
  return db.select<Mission>(`SELECT * FROM missions WHERE contact_id = $1 ${ORDER}`, [contactId]);
}

export async function addMission(db: Db, contactId: number, description: string, dueDate: string): Promise<number> {
  const result = await db.execute('INSERT INTO missions (contact_id, description, due_date) VALUES ($1, $2, $3)', [
    contactId,
    description.trim(),
    dueDate.trim() === '' ? null : dueDate.trim(),
  ]);
  return result.lastInsertId;
}

export async function deleteMission(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM missions WHERE id = $1', [id]);
}

/** A mission needs something to do. A due date is optional. */
export function missionIsUsable(description: string): boolean {
  return description.trim() !== '';
}