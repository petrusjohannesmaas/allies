import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import JournalRow from './JournalRow.svelte';
import type { JournalRow as Row } from '$lib/repo/journal';

function row(fields: Partial<Row> & { kind: Row['kind'] }): Row {
  return {
    source_id: 1,
    day: '2026-10-13',
    body: null,
    face: null,
    contact_id: null,
    contact_name: null,
    ...fields,
  };
}

describe('a manual journal entry', () => {
  it('shows what the user wrote', () => {
    render(JournalRow, { props: { row: row({ kind: 'entry', body: 'A quiet day at home' }) } });

    expect(screen.getByTestId('journal-row-body').textContent).toBe('A quiet day at home');
    expect(screen.getByTestId('journal-row-kind').textContent).toBe('Journal entry');
    expect(screen.getByTestId('journal-row-date').textContent).toBe('13 October 2026');
  });

  it('can be deleted from here', () => {
    render(JournalRow, { props: { row: row({ kind: 'entry', body: 'A quiet day at home' }), onDelete: () => {} } });

    expect(screen.getByTestId('delete-entry')).toBeTruthy();
  });
});

describe('an automatic journal entry', () => {
  it('says it was created automatically and who it was with', () => {
    render(
      JournalRow,
      { props: { row: row({ kind: 'activity', body: 'We went skiing', contact_id: 1, contact_name: 'Ada Lovelace' }) } },
    );

    expect(screen.getByTestId('journal-row-kind').textContent).toBe('Activity');
    expect(screen.getByTestId('journal-row-automatic').textContent).toBe('Created automatically');
    expect(screen.getByTestId('journal-row-contact').textContent).toBe('with Ada Lovelace');
  });

  it('calls a logged call a call', () => {
    render(JournalRow, { props: { row: row({ kind: 'call', body: 'Caught up', contact_id: 1, contact_name: 'Ada Lovelace' }) } });

    expect(screen.getByTestId('journal-row-kind').textContent).toBe('Call');
  });

  it('has no way to delete it here', () => {
    render(
      JournalRow,
      { props: { row: row({ kind: 'activity', body: 'We went skiing', contact_id: 1, contact_name: 'Ada Lovelace' }) } },
    );

    expect(screen.queryByTestId('delete-entry')).toBeNull();
  });

  it('opens the contact page from the name', () => {
    render(
      JournalRow,
      { props: { row: row({ kind: 'activity', body: 'We went skiing', contact_id: 4, contact_name: 'Ada Lovelace' }) } },
    );

    expect(screen.getByTestId('open-journal-contact')).toBeTruthy();
  });
});

describe('a day rating', () => {
  it('shows the face and what it means', () => {
    render(JournalRow, { props: { row: row({ kind: 'rating', source_id: null, face: 2 }) } });

    expect(screen.getByTestId('journal-row-kind').textContent).toBe('Rating');
    expect(screen.getByTestId('journal-row-body').textContent?.trim()).toBe('You rated your day: Neutral');
    expect(screen.queryByTestId('delete-entry')).toBeNull();
  });
});
