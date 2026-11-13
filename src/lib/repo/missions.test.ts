import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput } from './contacts';
import { addMission, deleteMission, listMissions, hasText, moveTask, addTask, listTasks, setTaskDone, renameTask, deleteTask, updateMission } from './missions';

let db: Db;
let contact: number;

beforeEach(async () => {
  db = migratedDb();
  contact = await addContact(db, { ...blankInput(), firstName: 'Ada' });
});

describe('listing missions', () => {
  it('starts with none', async () => {
    expect(await listMissions(db, contact)).toEqual([]);
  });

  it('stores a description and a due date', async () => {
    await addMission(db, contact, 'Send the photos', '2026-11-01');

    expect(await listMissions(db, contact)).toEqual([
      expect.objectContaining({ description: 'Send the photos', due_date: '2026-11-01' }),
    ]);
  });

  it('takes a mission with no due date', async () => {
    await addMission(db, contact, 'Send the photos', '');

    expect((await listMissions(db, contact))[0].due_date).toBeNull();
  });

  it('lists the mission due soonest first, and a mission with no date last', async () => {
    await addMission(db, contact, 'No date', '');
    await addMission(db, contact, 'Later', '2026-12-01');
    await addMission(db, contact, 'Sooner', '2026-11-01');

    expect((await listMissions(db, contact)).map((mission) => mission.description)).toEqual(['Sooner', 'Later', 'No date']);
  });

  it('trims what the user typed', async () => {
    await addMission(db, contact, '  Send the photos  ', ' 2026-11-01 ');

    const [mission] = await listMissions(db, contact);
    expect(mission.description).toBe('Send the photos');
    expect(mission.due_date).toBe('2026-11-01');
  });

  it('shows one contact the missions of another does not hold', async () => {
    const other = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addMission(db, contact, 'For Ada', '');
    await addMission(db, other, 'For Grace', '');

    expect((await listMissions(db, contact)).map((mission) => mission.description)).toEqual(['For Ada']);
  });
});

describe('deleting a mission', () => {
  it('removes it', async () => {
    const id = await addMission(db, contact, 'Send the photos', '');

    await deleteMission(db, id);

    expect(await listMissions(db, contact)).toEqual([]);
  });
});

describe('a mission description', () => {
  it('has to hold something other than spaces', () => {
    expect(hasText('  ')).toBe(false);
    expect(hasText('Send the photos')).toBe(true);
  });
});

describe('mission progress', () => {
  it('a mission lists with its progress', async () => {
    const id = await addMission(db, contact, 'Send the photos', '');
    for (let position = 1; position <= 5; position++) {
      await db.execute('INSERT INTO tasks (mission_id, description, is_done, position) VALUES ($1, $2, $3, $4)', [
        id,
        `Task ${position}`,
        position <= 2 ? 1 : 0,
        position,
      ]);
    }

    expect(await listMissions(db, contact)).toEqual([expect.objectContaining({ done: 2, total: 5 })]);
  });
});

/** Puts tasks in a mission in the order given, without the code under test. */
async function seedTasks(mission: number, descriptions: string[]): Promise<void> {
  for (const [index, description] of descriptions.entries()) {
    await db.execute('INSERT INTO tasks (mission_id, description, position) VALUES ($1, $2, $3)', [mission, description, index + 1]);
  }
}

async function taskOrder(mission: number): Promise<string[]> {
  const rows = await db.select<{ description: string }>('SELECT description FROM tasks WHERE mission_id = $1 ORDER BY position', [mission]);
  return rows.map((row) => row.description);
}

async function taskId(mission: number, description: string): Promise<number> {
  const rows = await db.select<{ id: number }>('SELECT id FROM tasks WHERE mission_id = $1 AND description = $2', [mission, description]);
  return rows[0].id;
}

describe('moving a task', () => {
  it('moving a task up swaps it with the one above', async () => {
    const mission = await addMission(db, contact, 'Send the photos', '');
    await seedTasks(mission, ['A', 'B', 'C']);

    await moveTask(db, await taskId(mission, 'C'), 'up');

    expect(await taskOrder(mission)).toEqual(['A', 'C', 'B']);
  });

  it('moving the top task up changes nothing', async () => {
    const mission = await addMission(db, contact, 'Send the photos', '');
    await seedTasks(mission, ['A', 'B']);

    await moveTask(db, await taskId(mission, 'A'), 'up');

    expect(await taskOrder(mission)).toEqual(['A', 'B']);
  });
});

describe('a mission task list', () => {
  it('a new task goes to the end', async () => {
    const mission = await addMission(db, contact, 'Send the photos', '');
    await addTask(db, mission, 'A');
    await addTask(db, mission, 'B');

    await addTask(db, mission, 'C');

    expect((await listTasks(db, mission)).map((task) => task.description)).toEqual(['A', 'B', 'C']);
  });

  it('ticking a task keeps its place', async () => {
    const mission = await addMission(db, contact, 'Send the photos', '');
    for (const name of ['A', 'B', 'C']) await addTask(db, mission, name);
    const tasks = await listTasks(db, mission);

    await setTaskDone(db, tasks[1].id, true);

    expect((await listTasks(db, mission)).map((task) => [task.description, task.is_done])).toEqual([
      ['A', 0],
      ['B', 1],
      ['C', 0],
    ]);
  });

  it('renaming and deleting a task', async () => {
    const mission = await addMission(db, contact, 'Send the photos', '');
    await addTask(db, mission, 'A');
    await addTask(db, mission, 'B');
    const [a, b] = await listTasks(db, mission);

    await renameTask(db, b.id, 'Bee');
    await deleteTask(db, a.id);

    expect((await listTasks(db, mission)).map((task) => task.description)).toEqual(['Bee']);
  });
});

describe('editing a mission', () => {
  it('editing a mission changes its description and due date', async () => {
    const id = await addMission(db, contact, 'Send photos', '2026-12-01');

    await updateMission(db, id, 'Send the photos', '');

    expect(await listMissions(db, contact)).toEqual([
      expect.objectContaining({ description: 'Send the photos', due_date: null }),
    ]);
  });
});
