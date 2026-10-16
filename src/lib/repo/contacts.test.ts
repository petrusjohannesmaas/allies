import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import {
  addContact,
  blankInput,
  countContacts,
  deleteContact,
  fullName,
  getContact,
  listContacts,
  markViewed,
  searchContacts,
  toInput,
  updateContact,
  type ContactInput,
} from './contacts';

let db: Db;

function input(overrides: Partial<ContactInput> = {}): ContactInput {
  return { ...blankInput(), firstName: 'Ada', ...overrides };
}

beforeEach(() => {
  db = migratedDb();
});

describe('adding a contact', () => {
  it('stores the fields the form collected', async () => {
    const id = await addContact(
      db,
      input({ category: 'colleague', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', birthday: '1815-12-10' }),
    );

    const contact = await getContact(db, id);
    expect(contact).toMatchObject({
      category: 'colleague',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      birthday: '1815-12-10',
    });
  });

  it('stores an empty field as null, not as an empty string', async () => {
    const id = await addContact(db, input({ firstName: 'Grace', lastName: '   ', email: '', birthday: '' }));

    const contact = await getContact(db, id);
    expect(contact?.last_name).toBeNull();
    expect(contact?.email).toBeNull();
    expect(contact?.birthday).toBeNull();
  });

  it('trims the name the user typed', async () => {
    const id = await addContact(db, input({ firstName: '  Ada  ' }));
    expect((await getContact(db, id))?.first_name).toBe('Ada');
  });

  it('refuses a category outside the eight', async () => {
    await expect(addContact(db, input({ category: 'coworker' as never }))).rejects.toThrow(/CHECK constraint failed/);
  });

  it('counts what the dashboard counts', async () => {
    expect(await countContacts(db)).toBe(0);
    await addContact(db, input({ firstName: 'Ada' }));
    await addContact(db, input({ firstName: 'Grace' }));
    expect(await countContacts(db)).toBe(2);
  });
});

describe('listing contacts', () => {
  it('is empty on a first run', async () => {
    expect(await listContacts(db)).toEqual([]);
  });

  it('sorts by last name, then first name', async () => {
    await addContact(db, input({ firstName: 'Zoe', lastName: 'Adams' }));
    await addContact(db, input({ firstName: 'Alan', lastName: 'Brown' }));
    await addContact(db, input({ firstName: 'Grace', lastName: 'Brown' }));
    await addContact(db, input({ firstName: 'Ada', lastName: 'Lovelace' }));

    expect((await listContacts(db)).map(fullName)).toEqual(['Zoe Adams', 'Alan Brown', 'Grace Brown', 'Ada Lovelace']);
  });

  it('sorts a contact known by one name under that name', async () => {
    await addContact(db, input({ firstName: 'Zoe', lastName: 'Adams' }));
    await addContact(db, input({ firstName: 'Prince' }));

    expect((await listContacts(db)).map(fullName)).toEqual(['Zoe Adams', 'Prince']);
  });

  it('ignores letter case when it sorts', async () => {
    await addContact(db, input({ firstName: 'Zoe', lastName: 'adams' }));
    await addContact(db, input({ firstName: 'Alan', lastName: 'Brown' }));

    expect((await listContacts(db)).map(fullName)).toEqual(['Zoe adams', 'Alan Brown']);
  });
});

describe('reading one contact', () => {
  it('answers null when the contact is gone', async () => {
    await expect(getContact(db, 99)).resolves.toBeNull();
  });

  it('turns a contact back into form input', async () => {
    const id = await addContact(db, input({ category: 'mentor', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' }));
    const contact = await getContact(db, id);

    expect(toInput(contact!)).toEqual({
      category: 'mentor',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      birthday: '',
    });
  });
});

describe('updating a contact', () => {
  it('keeps the change, including a field cleared to empty', async () => {
    const id = await addContact(db, input({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' }));

    await updateContact(db, id, input({ category: 'mentor', firstName: 'Ada', lastName: 'Byron', email: '' }));

    const contact = await getContact(db, id);
    expect(contact?.category).toBe('mentor');
    expect(contact?.last_name).toBe('Byron');
    expect(contact?.email).toBeNull();
  });

  it('shows the new value in the list', async () => {
    const id = await addContact(db, input({ firstName: 'Ada', lastName: 'Lovelace' }));
    await updateContact(db, id, input({ firstName: 'Ada', lastName: 'Byron' }));

    expect((await listContacts(db)).map(fullName)).toEqual(['Ada Byron']);
  });
});

describe('searching contacts', () => {
  beforeEach(async () => {
    await addContact(db, input({ firstName: 'Ada', lastName: 'Lovelace' }));
    await addContact(db, input({ firstName: 'Grace', lastName: 'Hopper' }));
    await addContact(db, input({ firstName: 'Alan', lastName: 'Turing' }));
  });

  it('finds nothing in an empty box', async () => {
    expect(await searchContacts(db, '')).toEqual([]);
    expect(await searchContacts(db, '   ')).toEqual([]);
  });

  it('finds a contact by part of a first name', async () => {
    expect((await searchContacts(db, 'Ada')).map(fullName)).toEqual(['Ada Lovelace']);
  });

  it('finds a contact by part of a last name', async () => {
    expect((await searchContacts(db, 'Hopp')).map(fullName)).toEqual(['Grace Hopper']);
  });

  it('finds a contact by part of the whole name', async () => {
    expect((await searchContacts(db, 'ce Ho')).map(fullName)).toEqual(['Grace Hopper']);
  });

  it('ignores letter case', async () => {
    expect((await searchContacts(db, 'tURing')).map(fullName)).toEqual(['Alan Turing']);
    expect((await searchContacts(db, 'ADA')).map(fullName)).toEqual(['Ada Lovelace']);
  });

  it('lists every match, by name', async () => {
    await addContact(db, input({ firstName: 'Ada', lastName: 'Lovelace-Byron' }));

    expect((await searchContacts(db, 'Ada')).map(fullName)).toEqual(['Ada Lovelace', 'Ada Lovelace-Byron']);
  });

  it('finds a contact known by one name', async () => {
    await addContact(db, input({ firstName: 'Prince' }));
    expect((await searchContacts(db, 'prin')).map(fullName)).toEqual(['Prince']);
  });

  it('answers nothing when nothing matches', async () => {
    expect(await searchContacts(db, 'zzz')).toEqual([]);
  });

  it('treats a percent sign as text, not as a wildcard', async () => {
    expect(await searchContacts(db, '%')).toEqual([]);
    expect(await searchContacts(db, 'a%')).toEqual([]);
  });

  it('shows at most eight results', async () => {
    for (let index = 0; index < 12; index++) {
      await addContact(db, input({ firstName: `Ada${index}`, lastName: 'Lovelace' }));
    }

    expect(await searchContacts(db, 'Ada')).toHaveLength(8);
  });
});

describe('marking a contact viewed', () => {
  let id: number;

  beforeEach(async () => {
    id = await addContact(db, input({ firstName: 'Ada' }));
  });

  it('records that the user opened the contact', async () => {
    expect((await getContact(db, id))?.last_viewed_at).toBeNull();

    await markViewed(db, id);

    expect((await getContact(db, id))?.last_viewed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('records a later time the next time the page opens', async () => {
    await markViewed(db, id);
    const first = (await getContact(db, id))!.last_viewed_at!;

    await new Promise((done) => setTimeout(done, 2));
    await markViewed(db, id);

    expect((await getContact(db, id))!.last_viewed_at! > first).toBe(true);
  });

  it('leaves the contact itself alone', async () => {
    await markViewed(db, id);

    expect((await getContact(db, id))?.first_name).toBe('Ada');
  });
});

describe('deleting a contact', () => {
  it('takes the contact out of the list and the count', async () => {
    const adaId = await addContact(db, input({ firstName: 'Ada' }));
    await addContact(db, input({ firstName: 'Grace' }));
    const ada = await getContact(db, adaId);

    await deleteContact(db, ada!);

    expect((await listContacts(db)).map(fullName)).toEqual(['Grace']);
    expect(await countContacts(db)).toBe(1);
  });

  it('is quiet when the contact is already gone', async () => {
    await expect(deleteContact(db, { id: 99, picture: null } as never)).resolves.toBeUndefined();
  });
});