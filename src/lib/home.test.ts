import { describe, expect, it } from 'vitest';
import { homeView } from './home.svelte';

const contacts = (...ids: number[]) => ids.map((id) => ({ id }));

describe('homeView', () => {
  it('picks a random contact when none is remembered', () => {
    expect(homeView(contacts(1, 2, 3, 4), null, { random: () => 0.5 }).selected?.id).toBe(3);
  });

  it('keeps the remembered contact', () => {
    expect(homeView(contacts(1, 2, 3, 4), 2, { random: () => 0.99 }).selected?.id).toBe(2);
  });

  it('picks again when the remembered contact is gone', () => {
    expect(homeView(contacts(1, 3, 4), 2, { random: () => 0 }).selected?.id).toBe(1);
  });

  it('has nothing selected with no contacts', () => {
    expect(homeView([], null, { random: () => 0.5 }).selected).toBeNull();
  });
});
