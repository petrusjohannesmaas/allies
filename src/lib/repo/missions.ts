import type { Db } from '../db';

/** A mission as the missions table holds it. */
export interface Mission {
  id: number;
  contact_id: number;
  description: string;
  due_date: string | null;
  /** Ticked tasks. */
  done: number;
  /** All tasks. */
  total: number;
}

/** Soonest due date first, and a mission with no date last. */
const ORDER = 'ORDER BY due_date IS NULL, due_date, id';

export async function listMissions(db: Db, contactId: number): Promise<Mission[]> {
  return db.select<Mission>(
    `SELECT missions.*,
            (SELECT COUNT(*) FROM tasks WHERE tasks.mission_id = missions.id AND tasks.is_done = 1) AS done,
            (SELECT COUNT(*) FROM tasks WHERE tasks.mission_id = missions.id) AS total
       FROM missions WHERE contact_id = $1 ${ORDER}`,
    [contactId],
  );
}

export async function addMission(db: Db, contactId: number, description: string, dueDate: string): Promise<number> {
  const result = await db.execute('INSERT INTO missions (contact_id, description, due_date) VALUES ($1, $2, $3)', [
    contactId,
    description.trim(),
    dueDate.trim() === '' ? null : dueDate.trim(),
  ]);
  return result.lastInsertId;
}

export async function updateMission(db: Db, id: number, description: string, dueDate: string): Promise<void> {
  await db.execute('UPDATE missions SET description = $2, due_date = $3 WHERE id = $1', [
    id,
    description.trim(),
    dueDate.trim() === '' ? null : dueDate.trim(),
  ]);
}

export async function deleteMission(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM missions WHERE id = $1', [id]);
}

/** A task as the tasks table holds it. `is_done` is 0 or 1. */
export interface Task {
  id: number;
  mission_id: number;
  description: string;
  is_done: number;
  position: number;
}

export async function listTasks(db: Db, missionId: number): Promise<Task[]> {
  return db.select<Task>('SELECT * FROM tasks WHERE mission_id = $1 ORDER BY position', [missionId]);
}

/** The new task takes the position after the last one, in one statement. */
export async function addTask(db: Db, missionId: number, description: string): Promise<number> {
  const result = await db.execute(
    'INSERT INTO tasks (mission_id, description, position) SELECT $1, $2, COALESCE(MAX(position), 0) + 1 FROM tasks WHERE mission_id = $1',
    [missionId, description.trim()],
  );
  return result.lastInsertId;
}

/** A mission needs something to do. A due date is optional. */
export function hasText(description: string): boolean {
  return description.trim() !== '';
}

/**
 * Swaps a task with its neighbour in one statement, so the move either
 * happens or does not. A task with no neighbour that way stays where it is.
 */
export async function moveTask(db: Db, id: number, direction: 'up' | 'down'): Promise<void> {
  const [compare, order] = direction === 'up' ? ['<', 'DESC'] : ['>', 'ASC'];
  await db.execute(
    `WITH pair AS (
       SELECT this.id AS this_id, this.position AS this_position,
              (SELECT other.id FROM tasks other
                WHERE other.mission_id = this.mission_id AND other.position ${compare} this.position
                ORDER BY other.position ${order} LIMIT 1) AS other_id
         FROM tasks this WHERE this.id = $1
     ), swap AS (
       SELECT pair.this_id AS id, (SELECT position FROM tasks WHERE id = pair.other_id) AS position FROM pair WHERE pair.other_id IS NOT NULL
       UNION ALL
       SELECT pair.other_id AS id, pair.this_position AS position FROM pair WHERE pair.other_id IS NOT NULL
     )
     UPDATE tasks SET position = swap.position FROM swap WHERE tasks.id = swap.id`,
    [id],
  );
}

/** Ticking changes only the flag, so the task keeps its place. */
export async function setTaskDone(db: Db, id: number, done: boolean): Promise<void> {
  await db.execute('UPDATE tasks SET is_done = $2 WHERE id = $1', [id, done ? 1 : 0]);
}

export async function renameTask(db: Db, id: number, description: string): Promise<void> {
  await db.execute('UPDATE tasks SET description = $2 WHERE id = $1', [id, description.trim()]);
}

export async function deleteTask(db: Db, id: number): Promise<void> {
  await db.execute('DELETE FROM tasks WHERE id = $1', [id]);
}
