import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput } from './contacts';
import { addReminder, deleteReminder, listReminders } from './reminders';

let db: Db;
let ada: number;

beforeEach(async () => {
  db = migratedDb();
  ada = await addContact(db, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
});

describe('reminders', () => {
  it('starts with none', async () => {
    expect(await listReminders(db, ada)).toEqual([]);
  });

  it('keeps the date, the description and the yearly repeat', async () => {
    await addReminder(db, ada, '2026-10-26', 'Send the photos', false);

    expect(await listReminders(db, ada)).toEqual([
      expect.objectContaining({
        remind_on: '2026-10-26',
        description: 'Send the photos',
        repeats_yearly: 0,
      }),
    ]);
  });

  it('keeps the yearly repeat when the user asks for it', async () => {
    await addReminder(db, ada, '2026-10-26', 'Call for her birthday', true);

    expect((await listReminders(db, ada))[0].repeats_yearly).toBe(1);
  });

  it('trims what the user typed', async () => {
    await addReminder(db, ada, '2026-10-26', '  Send the photos  ', false);

    expect((await listReminders(db, ada))[0].description).toBe('Send the photos');
  });

  it('lists the soonest reminder first', async () => {
    await addReminder(db, ada, '2026-11-05', 'Later', false);
    await addReminder(db, ada, '2026-10-26', 'Sooner', false);
    await addReminder(db, ada, '2026-10-30', 'In between', false);

    expect((await listReminders(db, ada)).map((reminder) => reminder.description)).toEqual([
      'Sooner',
      'In between',
      'Later',
    ]);
  });

  it('keeps the reminders of one contact out of another contact page', async () => {
    const grace = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addReminder(db, ada, '2026-10-26', 'Ada first', false);
    await addReminder(db, grace, '2026-10-26', 'Grace second', true);

    expect((await listReminders(db, ada)).map((reminder) => reminder.description)).toEqual(['Ada first']);
    expect((await listReminders(db, grace)).map((reminder) => reminder.description)).toEqual(['Grace second']);
  });

  it('removes one', async () => {
    const first = await addReminder(db, ada, '2026-10-26', 'Send the photos', false);
    await addReminder(db, ada, '2026-11-05', 'Call for her birthday', true);

    await deleteReminder(db, first);

    expect((await listReminders(db, ada)).map((reminder) => reminder.description)).toEqual(['Call for her birthday']);
  });

  it('goes when the contact goes', async () => {
    await addReminder(db, ada, '2026-10-26', 'Send the photos', false);

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    expect(await db.select<{ n: number }>('SELECT COUNT(*) AS n FROM reminders')).toEqual([{ n: 0 }]);
  });
});
