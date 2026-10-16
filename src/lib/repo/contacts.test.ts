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

describe('deleting a contact', () => {
  it('takes the contact out of the list and the count', async () => {
    const ada = await addContact(db, input({ firstName: 'Ada' }));
    await addContact(db, input({ firstName: 'Grace' }));

    await deleteContact(db, ada);

    expect((await listContacts(db)).map(fullName)).toEqual(['Grace']);
    expect(await countContacts(db)).toBe(1);
  });

  it('is quiet when the contact is already gone', async () => {
    await expect(deleteContact(db, 99)).resolves.toBeUndefined();
  });
});