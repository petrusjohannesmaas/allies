import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput } from './contacts';
import { addNote, deleteNote, listNotes, noteBodyIsUsable, setNoteFavourite, updateNote } from './notes';

let db: Db;
let contact: number;

beforeEach(async () => {
  db = migratedDb();
  contact = await addContact(db, { ...blankInput(), firstName: 'Ada' });
});

describe('listing notes', () => {
  it('starts with none', async () => {
    expect(await listNotes(db, contact)).toEqual([]);
  });

  it('stores the body and lists it', async () => {
    const id = await addNote(db, contact, 'Met at a conference');

    const notes = await listNotes(db, contact);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ id, body: 'Met at a conference', is_favourite: 0 });
  });

  it('lists the newest note first', async () => {
    await addNote(db, contact, 'First');
    await addNote(db, contact, 'Second');

    expect((await listNotes(db, contact)).map((note) => note.body)).toEqual(['Second', 'First']);
  });

  it('shows one contact the notes of another does not hold', async () => {
    const other = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addNote(db, contact, 'About Ada');
    await addNote(db, other, 'About Grace');

    expect((await listNotes(db, contact)).map((note) => note.body)).toEqual(['About Ada']);
  });
});

describe('a favourite note', () => {
  it('keeps the mark across a read', async () => {
    const id = await addNote(db, contact, 'Worth remembering');

    await setNoteFavourite(db, id, true);

    expect((await listNotes(db, contact))[0].is_favourite).toBe(1);
  });

  it('takes the mark off again', async () => {
    const id = await addNote(db, contact, 'Worth remembering');
    await setNoteFavourite(db, id, true);

    await setNoteFavourite(db, id, false);

    expect((await listNotes(db, contact))[0].is_favourite).toBe(0);
  });

  it('keeps the mark when the body is edited', async () => {
    const id = await addNote(db, contact, 'Met at a conference');
    await setNoteFavourite(db, id, true);

    await updateNote(db, id, 'Met at a conference in 1843');

    expect((await listNotes(db, contact))[0]).toMatchObject({
      is_favourite: 1,
      body: 'Met at a conference in 1843',
    });
  });
});

describe('editing a note', () => {
  it('keeps the new body', async () => {
    const id = await addNote(db, contact, 'Met at a confernce');

    await updateNote(db, id, 'Met at a conference');

    expect((await listNotes(db, contact))[0].body).toBe('Met at a conference');
  });

  it('leaves when it was written alone', async () => {
    const id = await addNote(db, contact, 'Met at a confernce');
    const before = (await listNotes(db, contact))[0];

    await updateNote(db, id, 'Met at a conference');

    expect((await listNotes(db, contact))[0].created_at).toBe(before.created_at);
  });
});

describe('deleting a note', () => {
  it('removes it', async () => {
    const id = await addNote(db, contact, 'Met at a conference');

    await deleteNote(db, id);

    expect(await listNotes(db, contact)).toEqual([]);
  });

  it('leaves another contact the notes alone', async () => {
    const other = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addNote(db, contact, 'About Ada');
    await addNote(db, other, 'About Grace');

    await deleteNote(db, (await listNotes(db, other))[0].id);

    expect((await listNotes(db, contact)).map((note) => note.body)).toEqual(['About Ada']);
    expect(await listNotes(db, other)).toEqual([]);
  });
});

describe('a note body', () => {
  it('has to hold something other than spaces', () => {
    expect(noteBodyIsUsable('   ')).toBe(false);
    expect(noteBodyIsUsable('a note')).toBe(true);
  });
});