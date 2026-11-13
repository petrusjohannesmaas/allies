import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ContactHeader from './ContactHeader.svelte';
import type { Contact, ContactFormResult } from '$lib/repo/contacts';

const ADA: Contact = {
  id: 1,
  category: 'colleague',
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  phone: '082 123 4567',
  birthday: '1815-12-10',
  picture: null,
  last_viewed_at: null,
  created_at: '2026-10-16T00:00:00.000Z',
};

function renderHeader(contact: Contact = ADA, tags: string[] = ['chess']) {
  const onsave = vi.fn<(result: ContactFormResult) => void>();
  render(ContactHeader, { props: { contact, tags, onsave } });
  return { onsave };
}

async function type(testId: string, value: string) {
  await fireEvent.input(screen.getByTestId(testId), { target: { value } });
}

describe('the contact header', () => {
  it('the header shows Save only after a change', async () => {
    renderHeader();

    await fireEvent.click(screen.getByTestId('edit-card'));
    expect(screen.queryByTestId('save-contact')).toBeNull();

    await type('contact-email', 'new@x.org');
    expect(screen.getByTestId('save-contact')).toBeTruthy();
  });

  it.each([
    ['the pencil', async () => fireEvent.click(screen.getByTestId('edit-card'))],
    ['Cancel', async () => fireEvent.click(screen.getByTestId('cancel-contact'))],
    ['Escape', async () => fireEvent.keyDown(screen.getByTestId('contact-email'), { key: 'Escape' })],
  ])('each discard action restores the old values: %s', async (_name, discard) => {
    renderHeader();
    await fireEvent.click(screen.getByTestId('edit-card'));
    await type('contact-email', 'new@x.org');

    await discard();

    expect(screen.queryByTestId('contact-form')).toBeNull();
    expect(screen.getByTestId('contact-email').textContent).toBe('ada@example.com');
  });

  it('an empty contact reads not set', () => {
    renderHeader({ ...ADA, last_name: null, email: null, phone: null, birthday: null }, []);

    expect(screen.getByTestId('contact-email').textContent).toBe('Email not set');
    expect(screen.getByTestId('contact-phone').textContent).toBe('Phone not set');
    expect(screen.getByTestId('contact-birthday').textContent).toBe('Birthday not set');
    expect(screen.getByTestId('contact-tags').textContent).toBe('Tags not set');
  });
});
