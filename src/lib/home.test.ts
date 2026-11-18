import { describe, expect, it } from 'vitest';
import { homeView, pickContact } from './home.svelte';

const contacts = (...ids: number[]) => ids.map((id) => ({ id }));

describe('pickContact', () => {
  it('picks a random contact when none is remembered', () => {
    expect(pickContact(contacts(1, 2, 3, 4), null, () => 0.5)?.id).toBe(3);
  });

  it('keeps the remembered contact', () => {
    expect(pickContact(contacts(1, 2, 3, 4), 2, () => 0.99)?.id).toBe(2);
  });

  it('picks again when the remembered contact is gone', () => {
    expect(pickContact(contacts(1, 3, 4), 2, () => 0)?.id).toBe(1);
  });

  it('has nothing selected with no contacts', () => {
    expect(pickContact([], null, () => 0.5)).toBeNull();
  });
});

describe('homeView', () => {
  const many = (n: number) => contacts(...Array.from({ length: n }, (_, index) => index + 1));
  const ids = (rows: { id: number }[]) => rows.map((row) => row.id);
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

  it('fits rows to the list height', () => {
    const view = homeView(many(25), 1, { listHeight: 560, page: null });
    expect(view.perPage).toBe(10);
    expect(view.pages).toBe(3);
    expect(ids(view.rows)).toEqual(range(1, 10));
  });

  it("opens on the selected contact's page", () => {
    const view = homeView(many(25), 23, { listHeight: 560, page: null });
    expect(view.page).toBe(3);
    expect(ids(view.rows)).toEqual(range(21, 25));
  });

  it('shows the page asked for', () => {
    const view = homeView(many(25), 23, { listHeight: 560, page: 2 });
    expect(ids(view.rows)).toEqual(range(11, 20));
    expect(view.selected?.id).toBe(23);
  });

  it('keeps the page in range', () => {
    expect(homeView(many(25), 1, { listHeight: 560, page: 7 }).page).toBe(3);
    expect(homeView(many(25), 1, { listHeight: 30, page: null }).perPage).toBe(1);
    const empty = homeView([], null, { listHeight: 560, page: null });
    expect([empty.page, empty.pages]).toEqual([1, 1]);
  });
});
