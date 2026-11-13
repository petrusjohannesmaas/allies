import { describe, expect, it } from 'vitest';
import { goBackFromMission, navigation, openContact, openMission } from './navigation.svelte';

describe('a mission screen', () => {
  it('a mission goes back to its contact', () => {
    openContact(7);
    openMission(7, 3);
    expect(navigation.screen).toBe('mission');
    expect(navigation.missionId).toBe(3);

    goBackFromMission();

    expect(navigation.screen).toBe('contact');
    expect(navigation.contactId).toBe(7);
  });
});
