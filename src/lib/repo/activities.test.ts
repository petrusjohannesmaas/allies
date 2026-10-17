import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { isActivityCategory } from '../activity-categories';
import { addContact, blankInput } from './contacts';
import { addActivity, deleteActivity, lastActivityTogether, listActivities } from './activities';

let db: Db;
let ada: number;

beforeEach(async () => {
  db = migratedDb();
  ada = await addContact(db, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
});

describe('activities', () => {
  it('starts with none', async () => {
    expect(await listActivities(db, ada)).toEqual([]);
  });

  it('keeps the category, the date and the description', async () => {
    await addActivity(db, ada, 'did sport together', '2026-10-13', 'We went skiing');

    expect(await listActivities(db, ada)).toEqual([
      expect.objectContaining({
        category: 'did sport together',
        happened_on: '2026-10-13',
        description: 'We went skiing',
      }),
    ]);
  });

  it('lists the newest activity first', async () => {
    await addActivity(db, ada, 'did something else', '2026-10-08', 'First');
    await addActivity(db, ada, 'did something else', '2026-10-13', 'Second');
    await addActivity(db, ada, 'did something else', '2026-10-11', 'Third');

    expect((await listActivities(db, ada)).map((activity) => activity.description)).toEqual([
      'Second',
      'Third',
      'First',
    ]);
  });

  it('lists two activities on the same day with the newer one first', async () => {
    await addActivity(db, ada, 'did something else', '2026-10-13', 'Earlier');
    await addActivity(db, ada, 'did something else', '2026-10-13', 'Later');

    expect((await listActivities(db, ada)).map((activity) => activity.description)).toEqual(['Later', 'Earlier']);
  });

  it('trims what the user typed', async () => {
    await addActivity(db, ada, 'did sport together', '2026-10-13', '  We went skiing  ');

    expect((await listActivities(db, ada))[0].description).toBe('We went skiing');
  });

  it('refuses a category that is not one of the picker options', async () => {
    await expect(addActivity(db, ada, 'went swimming', '2026-10-13', 'We went swimming')).rejects.toThrow(
      /category/,
    );
  });

  it('reads the date of the most recent activity', async () => {
    await addActivity(db, ada, 'did sport together', '2026-10-08', 'First');
    await addActivity(db, ada, 'ate at a restaurant', '2026-10-13', 'Second');

    expect(await lastActivityTogether(db, ada)).toBe('2026-10-13');
  });

  it('has no last activity when nothing was logged', async () => {
    expect(await lastActivityTogether(db, ada)).toBeNull();
  });

  it('has no last activity once every activity is deleted', async () => {
    const id = await addActivity(db, ada, 'did sport together', '2026-10-13', 'We went skiing');

    await deleteActivity(db, id);

    expect(await lastActivityTogether(db, ada)).toBeNull();
  });

  it('keeps the activities of one contact out of another contact page', async () => {
    const grace = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addActivity(db, ada, 'did something else', '2026-10-08', 'Ada first');
    await addActivity(db, grace, 'did something else', '2026-10-13', 'Grace second');

    expect((await listActivities(db, ada)).map((activity) => activity.description)).toEqual(['Ada first']);
    expect(await lastActivityTogether(db, grace)).toBe('2026-10-13');
  });

  it('removes one', async () => {
    const first = await addActivity(db, ada, 'did sport together', '2026-10-08', 'First');
    await addActivity(db, ada, 'ate at a restaurant', '2026-10-13', 'Second');

    await deleteActivity(db, first);

    expect((await listActivities(db, ada)).map((activity) => activity.description)).toEqual(['Second']);
  });

  it('goes when the contact goes', async () => {
    await addActivity(db, ada, 'did sport together', '2026-10-13', 'We went skiing');

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    expect(await db.select<{ n: number }>('SELECT COUNT(*) AS n FROM activities')).toEqual([{ n: 0 }]);
  });
});

describe('the category a picker may offer', () => {
  it('takes every category the app offers', () => {
    for (const category of ['ate at a restaurant', 'did sport together', 'went to the theater', 'just talked at home', 'did something else']) {
      expect(isActivityCategory(category)).toBe(true);
    }
  });

  it('takes nothing else', () => {
    expect(isActivityCategory('went swimming')).toBe(false);
    expect(isActivityCategory('')).toBe(false);
  });
});
