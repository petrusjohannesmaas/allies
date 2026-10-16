import type { ContactInput } from './repo/contacts';

/** The messages under each field, keyed by field name. An empty object means the input is fine. */
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

// Enough for an address the user can actually receive mail at: something
// before the @, an @, a domain with a dot in it, and nothing around it.
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/**
 * Only the first name is required, since a contact may be known by one name.
 * Every field is checked before anything is written, so the user sees all the
 * problems at once. The birthday needs no check: the date field only ever
 * yields `YYYY-MM-DD` or nothing.
 */
export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};

  if (input.firstName.trim() === '') {
    errors.firstName = 'Enter a first name.';
  }

  const email = input.email.trim();
  if (email !== '' && !EMAIL.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}