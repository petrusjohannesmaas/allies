import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import About from './About.svelte';
import { db } from '$lib/db';
import { addContact, blankInput } from '$lib/repo/contacts';

let contactId: number;

beforeEach(async () => {
  contactId = await addContact(await db(), { ...blankInput(), firstName: 'Ada' });
});

describe('the About card', () => {
  it('an empty About reads not set', async () => {
    render(About, { props: { contactId } });
    await screen.findByText('Significant other not set', { exact: false });

    const text = screen.getByTestId('about').textContent ?? '';
    for (const line of ['Significant other not set', 'Children not set', 'How you met not set', 'Work not set', 'Food preferences not set']) {
      expect(text).toContain(line);
    }
  });

  it('About shows Save only after a change', async () => {
    render(About, { props: { contactId } });
    await screen.findByText('Significant other not set', { exact: false });

    await fireEvent.click(screen.getByTestId('edit-card'));
    expect(screen.queryByTestId('save-profile')).toBeNull();

    await fireEvent.input(await screen.findByTestId('how-met-input'), { target: { value: 'Chess club' } });
    expect(await screen.findByTestId('save-profile')).toBeTruthy();
  });
});
