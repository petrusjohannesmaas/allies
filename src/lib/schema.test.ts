import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb, migrationFiles } from '../test/sqlite-db';
import type { Db } from './db';

const CATEGORIES = [
  'family',
  'friend',
  'colleague',
  'acquaintance',
  'mentor',
  'community',
  'stranger',
  'online',
];

interface JournalRow {
  kind: string;
  source_id: number | null;
  day: string;
  body: string | null;
  face: number | null;
  contact_id: number | null;
}

let db: Db;

beforeEach(() => {
  db = migratedDb();
});

async function addContact(firstName: string, category = 'friend'): Promise<number> {
  const result = await db.execute('INSERT INTO contacts (category, first_name) VALUES ($1, $2)', [
    category,
    firstName,
  ]);
  return result.lastInsertId;
}

async function counts(): Promise<Record<string, number>> {
  const tables = [
    'notes',
    'phone_numbers',
    'addresses',
    'contact_children',
    'contact_tags',
    'missions',
    'calls',
    'activities',
    'reminders',
  ];
  const out: Record<string, number> = {};
  for (const table of tables) {
    const rows = await db.select<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
    out[table] = rows[0].n;
  }
  return out;
}

describe('the migration', () => {
  it('runs with foreign keys on, so the cascades fire', async () => {
    const contact = await addContact('Ada');
    await db.execute('INSERT INTO notes (contact_id, body) VALUES ($1, $2)', [contact, 'Met at a conference']);
    await db.execute('DELETE FROM contacts WHERE id = $1', [contact]);
    expect(await db.select('SELECT * FROM notes')).toEqual([]);
  });

  it('runs the migration files the app ships', () => {
    const files = migrationFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files.join('\n')).toContain('CREATE TABLE contacts');
    expect(files.join('\n')).toContain('CREATE VIEW journal');
  });
});

describe('the contacts table', () => {
  it.each(CATEGORIES)('accepts the %s category', async (category) => {
    await expect(addContact('Ada', category)).resolves.toBeTypeOf('number');
  });

  it('refuses a category outside the list', async () => {
    await expect(addContact('Ada', 'coworker')).rejects.toThrow(/CHECK constraint failed/);
  });

  it('needs a first name', async () => {
    await expect(db.execute('INSERT INTO contacts (category, first_name) VALUES ($1, $2)', ['friend', null])).rejects.toThrow(
      /NOT NULL constraint failed/,
    );
  });

  it('records the timestamps a contact row carries', async () => {
    const contact = await addContact('Ada');
    const rows = await db.select<{ created_at: string; birthday: string | null }>(
      'SELECT created_at, birthday FROM contacts WHERE id = $1',
      [contact],
    );
    expect(rows[0].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(rows[0].birthday).toBeNull();
  });
});

describe('the day ratings table', () => {
  it('refuses a second rating for the same day', async () => {
    await db.execute('INSERT INTO day_ratings (day, face) VALUES ($1, $2)', ['2026-10-16', 2]);
    await expect(db.execute('INSERT INTO day_ratings (day, face) VALUES ($1, $2)', ['2026-10-16', 3])).rejects.toThrow(
      /UNIQUE constraint failed/,
    );
  });

  it('keeps a rating for each different day', async () => {
    await db.execute('INSERT INTO day_ratings (day, face) VALUES ($1, $2)', ['2026-10-16', 1]);
    await expect(db.execute('INSERT INTO day_ratings (day, face) VALUES ($1, $2)', ['2026-10-17', 3])).resolves.toBeTruthy();
  });

  it.each([0, 4, -1])('refuses the face %i', async (face) => {
    await expect(db.execute('INSERT INTO day_ratings (day, face) VALUES ($1, $2)', ['2026-10-16', face])).rejects.toThrow(
      /CHECK constraint failed/,
    );
  });
});

describe('the addresses table', () => {
  it('allows one home address per contact', async () => {
    const contact = await addContact('Ada');
    await db.execute('INSERT INTO addresses (contact_id, city, is_home) VALUES ($1, $2, 1)', [contact, 'Cape Town']);
    await expect(
      db.execute('INSERT INTO addresses (contact_id, city, is_home) VALUES ($1, $2, 1)', [contact, 'Johannesburg']),
    ).rejects.toThrow(/UNIQUE constraint failed/);
  });

  it('allows several addresses that are not home', async () => {
    const contact = await addContact('Ada');
    await db.execute('INSERT INTO addresses (contact_id, city, is_home) VALUES ($1, $2, 0)', [contact, 'Cape Town']);
    await db.execute('INSERT INTO addresses (contact_id, city, is_home) VALUES ($1, $2, 0)', [contact, 'Joburg']);
    const rows = await db.select<{ n: number }>('SELECT COUNT(*) AS n FROM addresses WHERE contact_id = $1', [contact]);
    expect(rows[0].n).toBe(2);
  });

  it('gives each contact its own home address', async () => {
    const first = await addContact('Ada');
    const second = await addContact('Grace');
    await db.execute('INSERT INTO addresses (contact_id, city, is_home) VALUES ($1, $2, 1)', [first, 'Cape Town']);
    await expect(db.execute('INSERT INTO addresses (contact_id, city, is_home) VALUES ($1, $2, 1)', [second, 'Joburg'])).resolves.toBeTruthy();
  });
});

describe('the contact children table', () => {
  it('refuses a contact that is its own child', async () => {
    const contact = await addContact('Ada');
    await expect(db.execute('INSERT INTO contact_children (parent_id, child_id) VALUES ($1, $1)', [contact])).rejects.toThrow(
      /CHECK constraint failed/,
    );
  });

  it('refuses the same child twice', async () => {
    const parent = await addContact('Ada');
    const child = await addContact('Grace');
    await db.execute('INSERT INTO contact_children (parent_id, child_id) VALUES ($1, $2)', [parent, child]);
    await expect(db.execute('INSERT INTO contact_children (parent_id, child_id) VALUES ($1, $2)', [parent, child])).rejects.toThrow(
      /UNIQUE constraint failed/,
    );
  });
});

describe('deleting a contact', () => {
  it('deletes its rows in every table that references it', async () => {
    const contact = await addContact('Ada');
    const child = await addContact('Grace');
    await addContact('Alan');

    await db.execute('INSERT INTO notes (contact_id, body) VALUES ($1, $2)', [contact, 'A note']);
    await db.execute('INSERT INTO phone_numbers (contact_id, label, number) VALUES ($1, $2, $3)', [contact, 'mobile', '082123']);
    await db.execute('INSERT INTO addresses (contact_id, city, is_home) VALUES ($1, $2, 1)', [contact, 'Cape Town']);
    await db.execute('INSERT INTO contact_children (parent_id, child_id) VALUES ($1, $2)', [contact, child]);
    await db.execute('INSERT INTO contact_tags (contact_id, tag) VALUES ($1, $2)', [contact, 'chess']);
    await db.execute('INSERT INTO missions (contact_id, description) VALUES ($1, $2)', [contact, 'Send the photos']);
    await db.execute('INSERT INTO calls (contact_id, called_on, description) VALUES ($1, $2, $3)', [contact, '2026-10-01', 'Chat']);
    await db.execute('INSERT INTO activities (contact_id, category, happened_on, description) VALUES ($1, $2, $3, $4)', [
      contact,
      'did sport together',
      '2026-10-02',
      'Ran 10 km',
    ]);
    await db.execute('INSERT INTO reminders (contact_id, remind_on, description) VALUES ($1, $2, $3)', [contact, '2026-11-01', 'Call']);

    await db.execute('DELETE FROM contacts WHERE id = $1', [contact]);

    expect(await counts()).toEqual({
      notes: 0,
      phone_numbers: 0,
      addresses: 0,
      contact_children: 0,
      contact_tags: 0,
      missions: 0,
      calls: 0,
      activities: 0,
      reminders: 0,
    });
  });

  it('sets another contact\'s significant other to null and leaves the contact', async () => {
    const ada = await addContact('Ada');
    const alan = await addContact('Alan');
    await db.execute('UPDATE contacts SET significant_other_id = $1 WHERE id = $2', [ada, alan]);

    await db.execute('DELETE FROM contacts WHERE id = $1', [ada]);

    const rows = await db.select<{ id: number; significant_other_id: number | null }>(
      'SELECT id, significant_other_id FROM contacts WHERE id = $1',
      [alan],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].significant_other_id).toBeNull();
  });

  it('takes the child link with it when the child goes', async () => {
    const parent = await addContact('Ada');
    const child = await addContact('Grace');
    await db.execute('INSERT INTO contact_children (parent_id, child_id) VALUES ($1, $2)', [parent, child]);

    await db.execute('DELETE FROM contacts WHERE id = $1', [child]);

    const rows = await db.select('SELECT * FROM contact_children');
    expect(rows).toEqual([]);
    expect(await db.select('SELECT id FROM contacts WHERE id = $1', [parent])).toHaveLength(1);
  });
});

describe('the journal view', () => {
  it('lists manual entries, ratings, activities and calls as one set of rows', async () => {
    const contact = await addContact('Ada');
    await db.execute('INSERT INTO journal_entries (entry_date, body) VALUES ($1, $2)', ['2026-10-03', 'A quiet day']);
    await db.execute('INSERT INTO day_ratings (day, face) VALUES ($1, $2)', ['2026-10-04', 3]);
    await db.execute('INSERT INTO activities (contact_id, category, happened_on, description) VALUES ($1, $2, $3, $4)', [
      contact,
      'ate at a restaurant',
      '2026-10-05',
      'Dinner at the Botanicals',
    ]);
    await db.execute('INSERT INTO calls (contact_id, called_on, description) VALUES ($1, $2, $3)', [contact, '2026-10-06', 'Caught up']);

    const rows = await db.select<JournalRow>('SELECT * FROM journal ORDER BY day, kind');
    expect(rows).toEqual([
      { kind: 'entry', source_id: 1, day: '2026-10-03', body: 'A quiet day', face: null, contact_id: null },
      { kind: 'rating', source_id: null, day: '2026-10-04', body: null, face: 3, contact_id: null },
      { kind: 'activity', source_id: 1, day: '2026-10-05', body: 'Dinner at the Botanicals', face: null, contact_id: contact },
      { kind: 'call', source_id: 1, day: '2026-10-06', body: 'Caught up', face: null, contact_id: contact },
    ]);
  });

  it('has no row for a deleted activity', async () => {
    const contact = await addContact('Ada');
    await db.execute('INSERT INTO activities (contact_id, category, happened_on, description) VALUES ($1, $2, $3, $4)', [
      contact,
      'did sport together',
      '2026-10-05',
      'Ran 10 km',
    ]);
    await db.execute('DELETE FROM activities WHERE id = 1');
    expect(await db.select('SELECT * FROM journal')).toEqual([]);
  });

  it('has no row for a deleted call', async () => {
    const contact = await addContact('Ada');
    await db.execute('INSERT INTO calls (contact_id, called_on, description) VALUES ($1, $2, $3)', [contact, '2026-10-06', 'Caught up']);
    await db.execute('DELETE FROM calls WHERE id = 1');
    expect(await db.select('SELECT * FROM journal')).toEqual([]);
  });

  it('takes the automatic rows with it when the contact goes', async () => {
    const contact = await addContact('Ada');
    await db.execute('INSERT INTO activities (contact_id, category, happened_on, description) VALUES ($1, $2, $3, $4)', [
      contact,
      'went to the theater',
      '2026-10-05',
      'The Nutcracker',
    ]);
    await db.execute('INSERT INTO calls (contact_id, called_on, description) VALUES ($1, $2, $3)', [contact, '2026-10-06', 'Chat']);
    await db.execute('DELETE FROM contacts WHERE id = $1', [contact]);
    expect(await db.select('SELECT * FROM journal')).toEqual([]);
  });

  it('keeps a manual entry that no contact owns', async () => {
    const contact = await addContact('Ada');
    await db.execute('INSERT INTO journal_entries (entry_date, body) VALUES ($1, $2)', ['2026-10-03', 'A quiet day']);
    await db.execute('DELETE FROM contacts WHERE id = $1', [contact]);
    expect(await db.select<JournalRow>('SELECT kind FROM journal')).toEqual([{ kind: 'entry' }]);
  });
});