import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput } from './contacts';
import { addActivity } from './activities';
import { addCall } from './calls';
import { addEntry, deleteEntry, getRating, listJournal, rateDay } from './journal';

let db: Db;
let ada: number;

beforeEach(async () => {
  db = migratedDb();
  ada = await addContact(db, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
});

describe('the journal', () => {
  it('starts with nothing', async () => {
    expect(await listJournal(db)).toEqual([]);
  });

  it('lists an entry the user wrote', async () => {
    await addEntry(db, '2026-10-13', 'A quiet day at home');

    expect(await listJournal(db)).toEqual([
      { kind: 'entry', source_id: 1, day: '2026-10-13', body: 'A quiet day at home', face: null, contact_id: null, contact_name: null },
    ]);
  });

  it('trims what the user typed', async () => {
    await addEntry(db, '2026-10-13', '  A quiet day at home  ');

    expect((await listJournal(db))[0].body).toBe('A quiet day at home');
  });

  it('lists the newest day first', async () => {
    await addEntry(db, '2026-10-11', 'Walked in the park');
    await addEntry(db, '2026-10-13', 'A quiet day at home');
    await addEntry(db, '2026-10-12', 'Saw the doctor');

    expect((await listJournal(db)).map((row) => row.body)).toEqual([
      'A quiet day at home',
      'Saw the doctor',
      'Walked in the park',
    ]);
  });

  it('lists a logged activity and the contact it was with', async () => {
    await addActivity(db, ada, 'did sport together', '2026-10-14', 'We went skiing');

    expect(await listJournal(db)).toEqual([
      { kind: 'activity', source_id: 1, day: '2026-10-14', body: 'We went skiing', face: null, contact_id: ada, contact_name: 'Ada Lovelace' },
    ]);
  });

  it('lists a logged call and the contact it was with', async () => {
    await addCall(db, ada, '2026-10-13', 'Caught up about the conference');

    expect(await listJournal(db)).toEqual([
      { kind: 'call', source_id: 1, day: '2026-10-13', body: 'Caught up about the conference', face: null, contact_id: ada, contact_name: 'Ada Lovelace' },
    ]);
  });

  it('lists a day rating with its face and no contact', async () => {
    await rateDay(db, '2026-10-13', 3);

    expect(await listJournal(db)).toEqual([
      { kind: 'rating', source_id: null, day: '2026-10-13', body: null, face: 3, contact_id: null, contact_name: null },
    ]);
  });

  it('lists the four kinds of one day in a fixed order', async () => {
    await addEntry(db, '2026-10-13', 'A quiet day at home');
    await rateDay(db, '2026-10-13', 2);
    await addActivity(db, ada, 'did sport together', '2026-10-13', 'We went skiing');
    await addCall(db, ada, '2026-10-13', 'Caught up about the conference');

    expect((await listJournal(db)).map((row) => row.kind)).toEqual(['activity', 'call', 'entry', 'rating']);
  });

  it('loses an automatic row when the activity goes', async () => {
    const id = await addActivity(db, ada, 'did sport together', '2026-10-14', 'We went skiing');

    await db.execute('DELETE FROM activities WHERE id = $1', [id]);

    expect(await listJournal(db)).toEqual([]);
  });

  it('loses an automatic row when the contact goes', async () => {
    await addCall(db, ada, '2026-10-13', 'Caught up about the conference');

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    expect(await listJournal(db)).toEqual([]);
  });

  it('keeps what the user wrote when a contact goes', async () => {
    await addEntry(db, '2026-10-12', 'Walked in the park');
    await addActivity(db, ada, 'did sport together', '2026-10-14', 'We went skiing');

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    expect((await listJournal(db)).map((row) => row.body)).toEqual(['Walked in the park']);
  });

  it('removes one entry and leaves the others', async () => {
    const first = await addEntry(db, '2026-10-12', 'Walked in the park');
    await addEntry(db, '2026-10-13', 'A quiet day at home');

    await deleteEntry(db, first);

    expect((await listJournal(db)).map((row) => row.body)).toEqual(['A quiet day at home']);
  });
});

describe('rating a day', () => {
  it('reads the face the day was given', async () => {
    await rateDay(db, '2026-10-13', 2);

    expect(await getRating(db, '2026-10-13')).toBe(2);
  });

  it('reads nothing for a day with no rating', async () => {
    expect(await getRating(db, '2026-10-13')).toBeNull();
  });

  it('refuses a second rating for the same day', async () => {
    await rateDay(db, '2026-10-13', 1);

    await expect(rateDay(db, '2026-10-13', 3)).rejects.toThrow(/UNIQUE constraint failed/);
    expect(await getRating(db, '2026-10-13')).toBe(1);
  });

  it('refuses a face that is not one of the three', async () => {
    await expect(rateDay(db, '2026-10-13', 4)).rejects.toThrow(/CHECK constraint failed/);
  });

  it('rates each day on its own', async () => {
    await rateDay(db, '2026-10-13', 1);
    await rateDay(db, '2026-10-14', 3);

    expect(await getRating(db, '2026-10-13')).toBe(1);
    expect(await getRating(db, '2026-10-14')).toBe(3);
  });
});
