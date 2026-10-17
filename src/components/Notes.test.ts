import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Notes from './Notes.svelte';
import { db } from '$lib/db';
import { addContact, blankInput } from '$lib/repo/contacts';
import { addNote, listNotes } from '$lib/repo/notes';

let contactId: number;

beforeEach(async () => {
  contactId = await addContact(await db(), { ...blankInput(), firstName: 'Ada' });
});

async function renderNotes() {
  // The list reads its notes after the component mounts, so the empty state
  // settles on the next task.
  render(Notes, { props: { contactId } });
  await new Promise((done) => setTimeout(done, 0));
}

async function write(body: string) {
  await fireEvent.input(screen.getByTestId('note-body'), { target: { value: body } });
  await fireEvent.click(screen.getByTestId('save-note'));
  await new Promise((done) => setTimeout(done, 0));
}

describe('the note list', () => {
  it('says so when the contact has no notes', async () => {
    await renderNotes();
    expect(screen.getByTestId('notes-empty')).toBeTruthy();
  });

  it('shows a note after it is saved, newest first', async () => {
    await renderNotes();

    await write('Met at a conference');
    await write('Lives in Cape Town');

    const texts = screen.getAllByTestId('note-text').map((note) => note.textContent);
    expect(texts).toEqual(['Lives in Cape Town', 'Met at a conference']);
  });

  it('will not save a note that is only spaces', async () => {
    await renderNotes();

    await write('   ');

    expect(screen.getByTestId('notes-empty')).toBeTruthy();
  });
});

describe('the favourite toggle', () => {
  it('marks a note and shows it as marked', async () => {
    await addNote(await db(), contactId, 'Worth remembering');
    await renderNotes();

    await fireEvent.click(screen.getByTestId('favourite-note'));
    await new Promise((done) => setTimeout(done, 0));

    expect(screen.getByTestId('note').getAttribute('data-favourite')).toBe('true');
    expect(screen.getByRole('button', { name: /Remove the favourite mark/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the mark in the database', async () => {
    const id = await addNote(await db(), contactId, 'Worth remembering');
    await renderNotes();

    await fireEvent.click(screen.getByTestId('favourite-note'));
    await new Promise((done) => setTimeout(done, 0));

    expect((await listNotes(await db(), contactId))[0].is_favourite).toBe(1);
    expect(id).toBeTypeOf('number');
  });

  it('takes the mark off again', async () => {
    await addNote(await db(), contactId, 'Worth remembering');
    await renderNotes();

    await fireEvent.click(screen.getByTestId('favourite-note'));
    await new Promise((done) => setTimeout(done, 0));
    await fireEvent.click(screen.getByTestId('favourite-note'));
    await new Promise((done) => setTimeout(done, 0));

    expect(screen.getByTestId('note').getAttribute('data-favourite')).toBe('false');
  });
});

describe('editing and deleting a note', () => {
  it('shows the new body after an edit', async () => {
    await addNote(await db(), contactId, 'Met at a confernce');
    await renderNotes();

    await fireEvent.click(screen.getByTestId('edit-note'));
    await fireEvent.input(screen.getByTestId('edit-note-body'), { target: { value: 'Met at a conference' } });
    await fireEvent.click(screen.getByTestId('save-edited-note'));
    await new Promise((done) => setTimeout(done, 0));

    expect(screen.getByTestId('note-text').textContent).toBe('Met at a conference');
  });

  it('leaves the note alone when the edit is cancelled', async () => {
    await addNote(await db(), contactId, 'Met at a conference');
    await renderNotes();

    await fireEvent.click(screen.getByTestId('edit-note'));
    await fireEvent.input(screen.getByTestId('edit-note-body'), { target: { value: 'Something else' } });
    await fireEvent.click(screen.getByTestId('cancel-edit-note'));
    await new Promise((done) => setTimeout(done, 0));

    expect(screen.getByTestId('note-text').textContent).toBe('Met at a conference');
  });

  it('removes a deleted note', async () => {
    await addNote(await db(), contactId, 'Met at a conference');
    await renderNotes();

    await fireEvent.click(screen.getByTestId('delete-note'));
    await new Promise((done) => setTimeout(done, 0));

    expect(screen.getByTestId('notes-empty')).toBeTruthy();
  });
});