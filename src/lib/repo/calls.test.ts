import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput } from './contacts';
import { addCall, deleteCall, lastCalled, listCalls } from './calls';

let db: Db;
let ada: number;

beforeEach(async () => {
  db = migratedDb();
  ada = await addContact(db, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
});

describe('calls', () => {
  it('starts with none', async () => {
    expect(await listCalls(db, ada)).toEqual([]);
  });

  it('keeps the date and the description', async () => {
    await addCall(db, ada, '2026-10-13', 'Caught up about the conference');

    expect(await listCalls(db, ada)).toEqual([
      expect.objectContaining({ called_on: '2026-10-13', description: 'Caught up about the conference' }),
    ]);
  });

  it('lists the newest call first', async () => {
    await addCall(db, ada, '2026-10-08', 'First call');
    await addCall(db, ada, '2026-10-13', 'Second call');
    await addCall(db, ada, '2026-10-11', 'Third call');

    expect((await listCalls(db, ada)).map((call) => call.description)).toEqual([
      'Second call',
      'Third call',
      'First call',
    ]);
  });

  it('lists two calls on the same day with the newer one first', async () => {
    await addCall(db, ada, '2026-10-13', 'Earlier');
    await addCall(db, ada, '2026-10-13', 'Later');

    expect((await listCalls(db, ada)).map((call) => call.description)).toEqual(['Later', 'Earlier']);
  });

  it('trims what the user typed', async () => {
    await addCall(db, ada, '2026-10-13', '  Caught up  ');

    expect((await listCalls(db, ada))[0].description).toBe('Caught up');
  });

  it('reads the date of the most recent call', async () => {
    await addCall(db, ada, '2026-10-08', 'First call');
    await addCall(db, ada, '2026-10-13', 'Second call');

    expect(await lastCalled(db, ada)).toBe('2026-10-13');
  });

  it('has no last call when the contact was never called', async () => {
    expect(await lastCalled(db, ada)).toBeNull();
  });

  it('has no last call once every call is deleted', async () => {
    const id = await addCall(db, ada, '2026-10-13', 'Caught up');

    await deleteCall(db, id);

    expect(await lastCalled(db, ada)).toBeNull();
  });

  it('keeps the calls of one contact out of another contact page', async () => {
    const grace = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addCall(db, ada, '2026-10-08', 'Ada first');
    await addCall(db, grace, '2026-10-13', 'Grace second');

    expect((await listCalls(db, ada)).map((call) => call.description)).toEqual(['Ada first']);
    expect(await lastCalled(db, grace)).toBe('2026-10-13');
  });

  it('removes one', async () => {
    const first = await addCall(db, ada, '2026-10-08', 'First call');
    await addCall(db, ada, '2026-10-13', 'Second call');

    await deleteCall(db, first);

    expect((await listCalls(db, ada)).map((call) => call.description)).toEqual(['Second call']);
  });

  it('goes when the contact goes', async () => {
    await addCall(db, ada, '2026-10-13', 'Caught up');

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    expect(await db.select<{ n: number }>('SELECT COUNT(*) AS n FROM calls')).toEqual([{ n: 0 }]);
  });
});
