import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput } from './contacts';
import { addMission, deleteMission, listMissions, missionIsUsable } from './missions';

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
    expect(missionIsUsable('  ')).toBe(false);
    expect(missionIsUsable('Send the photos')).toBe(true);
  });
});