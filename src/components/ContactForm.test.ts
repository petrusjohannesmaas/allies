import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ContactForm from './ContactForm.svelte';
import { blankInput, type Contact, type ContactInput } from '$lib/repo/contacts';

function renderForm(contact: Contact | null = null) {
  const onsave = vi.fn<(input: ContactInput) => void>();
  render(ContactForm, { props: { contact, onsave } });
  return { onsave };
}

function field(testId: string): HTMLInputElement | HTMLSelectElement {
  return screen.getByTestId(testId) as HTMLInputElement | HTMLSelectElement;
}

async function type(testId: string, value: string) {
  await fireEvent.input(screen.getByTestId(testId), { target: { value } });
}

async function save() {
  await fireEvent.click(screen.getByTestId('save-contact'));
}

describe('the contact form', () => {
  it('asks for a category, a first name, a last name, an email and a birthday', () => {
    renderForm();
    expect(screen.getByTestId('contact-category')).toBeTruthy();
    expect(screen.getByTestId('contact-first-name')).toBeTruthy();
    expect(screen.getByTestId('contact-last-name')).toBeTruthy();
    expect(screen.getByTestId('contact-email')).toBeTruthy();
    expect(screen.getByTestId('contact-birthday')).toBeTruthy();
  });

  it('refuses to save without a first name', async () => {
    const { onsave } = renderForm();

    await save();

    expect(screen.getByTestId('error-first-name').textContent).toBe('Enter a first name.');
    expect(onsave).not.toHaveBeenCalled();
  });

  it('refuses an email that is not an address', async () => {
    const { onsave } = renderForm();

    await type('contact-first-name', 'Ada');
    await type('contact-email', 'ada at example');
    await save();

    expect(screen.getByTestId('error-email').textContent).toBe('Enter a valid email address.');
    expect(onsave).not.toHaveBeenCalled();
  });

  it('accepts an email that is an address', async () => {
    const { onsave } = renderForm();

    await type('contact-first-name', 'Ada');
    await type('contact-email', 'ada@example.com');
    await save();

    expect(onsave).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Ada', email: 'ada@example.com' }));
  });

  it('saves with only a first name, because a contact may be known by one name', async () => {
    const { onsave } = renderForm();

    await type('contact-first-name', 'Prince');
    await save();

    expect(onsave).toHaveBeenCalledWith({ ...blankInput(), firstName: 'Prince' });
  });

  it('shows the first name and the email problems at the same time', async () => {
    const { onsave } = renderForm();

    await type('contact-email', 'nope');
    await save();

    expect(screen.getByTestId('error-first-name')).toBeTruthy();
    expect(screen.getByTestId('error-email')).toBeTruthy();
    expect(onsave).not.toHaveBeenCalled();
  });

  it('starts from a contact when it is editing one', async () => {
    const { onsave } = renderForm({
      id: 3,
      category: 'mentor',
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      birthday: '1815-12-10',
      picture: null,
      last_viewed_at: null,
      created_at: '2026-10-16T00:00:00.000Z',
    });

    expect(field('contact-first-name').value).toBe('Ada');
    expect(field('contact-category').value).toBe('mentor');

    await type('contact-last-name', 'Byron');
    await save();

    expect(onsave).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Ada', lastName: 'Byron' }));
  });
});