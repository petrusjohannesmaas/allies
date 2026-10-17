import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ContactForm from './ContactForm.svelte';
import { blankInput, type Contact, type ContactFormResult } from '$lib/repo/contacts';

function renderForm(contact: Contact | null = null) {
  const onsave = vi.fn<(result: ContactFormResult) => void>();
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

    expect(onsave).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ firstName: 'Ada', email: 'ada@example.com' }) }));
  });

  it('saves with only a first name, because a contact may be known by one name', async () => {
    const { onsave } = renderForm();

    await type('contact-first-name', 'Prince');
    await save();

    expect(onsave).toHaveBeenCalledWith({ input: { ...blankInput(), firstName: 'Prince' }, picture: null });
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

    expect(onsave).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ firstName: 'Ada', lastName: 'Byron' }) }));
  });
});

describe('the profile picture field', () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

  function pickFile(name: string, bytes: Uint8Array) {
    const file = new File([new Uint8Array(bytes).buffer], name, {
      type: bytes[0] === 0x25 ? 'application/pdf' : 'image/png',
    });
    const input = screen.getByTestId('contact-picture');
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    return fireEvent.change(input);
  }

  it('refuses a file that is not an image', async () => {
    const { onsave } = renderForm();

    await pickFile('notes.pdf', new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]));

    expect(screen.getByTestId('error-picture').textContent).toContain('notes.pdf');
    expect(screen.queryByTestId('picture-preview')).toBeNull();
    expect(onsave).not.toHaveBeenCalled();
  });

  it('saves an image with the contact', async () => {
    const { onsave } = renderForm();

    await type('contact-first-name', 'Ada');
    await pickFile('portrait.png', PNG);
    await save();

    expect(onsave).toHaveBeenCalledWith({
      input: expect.objectContaining({ firstName: 'Ada' }),
      picture: expect.objectContaining({ type: 'image/png' }),
    });
  });

  it('shows the picture the user picked', async () => {
    renderForm();

    await pickFile('portrait.png', PNG);

    expect(screen.getByTestId('picture-preview')).toBeTruthy();
  });

  it('offers only the image types the app stores', () => {
    renderForm();
    expect(field('contact-picture').getAttribute('accept')).toBe('image/png,image/jpeg,image/webp,image/gif');
  });
});