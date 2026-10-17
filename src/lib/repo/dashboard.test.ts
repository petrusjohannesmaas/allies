import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput } from './contacts';
import { countCallsAndActivities, listBirthdays, listDatedReminders, listRecentlyViewed } from './dashboard';

let db: Db;

beforeEach(async () => {
  db = migratedDb();
});

describe('the birthdays the dashboard needs', () => {
  it('brings every contact with a birthday and leaves the others out of the list', async () => {
    const ada = await addContact(db, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace', birthday: '1990-10-13' });
    await addContact(db, { ...blankInput(), firstName: 'Grace', lastName: 'Hopper' });

    expect(await listBirthdays(db)).toEqual([{ id: ada, name: 'Ada Lovelace', birthday: '1990-10-13' }]);
  });
});

describe('the reminders the dashboard needs', () => {
  it('brings every reminder with the contact it belongs to', async () => {
    const ada = await addContact(db, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
    await db.execute(
      'INSERT INTO reminders (contact_id, remind_on, description, repeats_yearly) VALUES ($1, $2, $3, $4)',
      [ada, '2026-10-26', 'Send the photos', 1],
    );

    expect(await listDatedReminders(db)).toEqual([
      { contactId: ada, contactName: 'Ada Lovelace', remindOn: '2026-10-26', description: 'Send the photos', repeatsYearly: true },
    ]);
  });

  it('goes when the contact goes', async () => {
    const ada = await addContact(db, { ...blankInput(), firstName: 'Ada' });
    await db.execute('INSERT INTO reminders (contact_id, remind_on, description) VALUES ($1, $2, $3)', [
      ada,
      '2026-10-26',
      'Send the photos',
    ]);

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    expect(await listDatedReminders(db)).toEqual([]);
  });
});

describe('the recently viewed contacts', () => {
  it('are the eight most recently opened, and the ones never opened are not among them', async () => {
    for (let index = 1; index <= 10; index += 1) {
      await db.execute('INSERT INTO contacts (category, first_name, last_name, last_viewed_at) VALUES ($1, $2, $3, $4)', [
        'friend',
        `Contact ${index}`,
        null,
        `2026-10-16T09:${`${index}`.padStart(2, '0')}:00.000Z`,
      ]);
    }
    await addContact(db, { ...blankInput(), firstName: 'Never', lastName: 'Opened' });

    const listed = await listRecentlyViewed(db);

    expect(listed).toHaveLength(8);
    expect(listed[0].name).toBe('Contact 10');
    expect(listed.at(-1)?.name).toBe('Contact 3');
    expect(listed.map((contact) => contact.name)).not.toContain('Never Opened');
  });

  it('are gone when the contact goes', async () => {
    const ada = await addContact(db, { ...blankInput(), firstName: 'Ada' });
    await db.execute('UPDATE contacts SET last_viewed_at = $1 WHERE id = $2', ['2026-10-16T09:00:00.000Z', ada]);

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    expect(await listRecentlyViewed(db)).toEqual([]);
  });
});

describe('the count of calls and activities', () => {
  it('counts every call and every activity as one number', async () => {
    const ada = await addContact(db, { ...blankInput(), firstName: 'Ada' });
    const grace = await addContact(db, { ...blankInput(), firstName: 'Grace' });

    expect(await countCallsAndActivities(db)).toBe(0);

    await db.execute('INSERT INTO calls (contact_id, called_on, description) VALUES ($1, $2, $3)', [
      ada,
      '2026-10-13',
      'Caught up',
    ]);
    await db.execute('INSERT INTO activities (contact_id, category, happened_on, description) VALUES ($1, $2, $3, $4)', [
      grace,
      'did sport together',
      '2026-10-14',
      'We went skiing',
    ]);
    await db.execute('INSERT INTO activities (contact_id, category, happened_on, description) VALUES ($1, $2, $3, $4)', [
      ada,
      'ate at a restaurant',
      '2026-10-15',
      'Lunch at the diner',
    ]);

    expect(await countCallsAndActivities(db)).toBe(3);
  });

  it('drop what the contact owned when it is deleted', async () => {
    const ada = await addContact(db, { ...blankInput(), firstName: 'Ada' });
    await db.execute('INSERT INTO calls (contact_id, called_on, description) VALUES ($1, $2, $3)', [
      ada,
      '2026-10-13',
      'Caught up',
    ]);

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    expect(await countCallsAndActivities(db)).toBe(0);
  });
});
