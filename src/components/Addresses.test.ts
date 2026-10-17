import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import Addresses from './Addresses.svelte';
import { db } from '$lib/db';
import { addContact, blankInput } from '$lib/repo/contacts';
import { addAddress, listAddresses } from '$lib/repo/details';

let contactId: number;

async function renderAddresses(rows = 0) {
  render(Addresses, { props: { contactId } });
  await waitFor(() => expect(screen.queryAllByTestId('address')).toHaveLength(rows));
}

function homes(): string[] {
  return screen
    .queryAllByTestId('address')
    .filter((address) => address.getAttribute('data-home') === 'true')
    .map((address) => address.querySelector('[data-testid="address-text"]')?.textContent ?? '');
}

/** The home address sorts first, so a row is found by what it reads, not by its place. */
function rowReading(text: string): HTMLElement {
  const row = screen
    .getAllByTestId('address')
    .find((address) => address.querySelector('[data-testid="address-text"]')?.textContent === text);
  if (!row) throw new Error(`No address reading "${text}" on the page`);
  return row;
}

async function clickHome(text: string) {
  await fireEvent.click(rowReading(text).querySelector('[data-testid="home-address"]')!);
}

beforeEach(async () => {
  const connection = await db();
  await connection.execute('DELETE FROM contacts');
  contactId = await addContact(connection, { ...blankInput(), firstName: 'Ada' });
});

describe('the addresses section', () => {
  it('says so when the contact has none', async () => {
    await renderAddresses();
    expect(screen.getByTestId('addresses-empty')).toBeTruthy();
  });

  it('adds an address from the four parts', async () => {
    await renderAddresses();

    await fireEvent.input(screen.getByTestId('address-street'), { target: { value: '12 Kei Road' } });
    await fireEvent.input(screen.getByTestId('address-city'), { target: { value: 'Cape Town' } });
    await fireEvent.input(screen.getByTestId('address-postal-code'), { target: { value: '8001' } });
    await fireEvent.input(screen.getByTestId('address-country'), { target: { value: 'South Africa' } });
    await fireEvent.click(screen.getByTestId('save-address'));

    await waitFor(() => expect(screen.getByTestId('address-text').textContent).toBe('12 Kei Road, Cape Town, 8001, South Africa'));
  });

  it('will not add an address with nothing in it', async () => {
    await renderAddresses();

    await fireEvent.click(screen.getByTestId('save-address'));

    await waitFor(() => expect(screen.getByTestId('addresses-empty')).toBeTruthy());
  });
});

describe('the home address toggle', () => {
  beforeEach(async () => {
    const connection = await db();
    await addAddress(connection, contactId, { street: '12 Kei Road', city: '', postalCode: '', country: '' });
    await addAddress(connection, contactId, { street: '3 Main Road', city: '', postalCode: '', country: '' });
  });

  it('shows no home address before one is chosen', async () => {
    await renderAddresses(2);
    expect(homes()).toEqual([]);
  });

  it('marks the address the user picks and leaves the other alone', async () => {
    await renderAddresses(2);

    await clickHome('3 Main Road');

    await waitFor(() => expect(homes()).toEqual(['3 Main Road']));
    expect(rowReading('12 Kei Road').getAttribute('data-home')).toBe('false');
  });

  it('labels the home address on the page', async () => {
    await renderAddresses(2);

    await clickHome('3 Main Road');

    await waitFor(() => expect(screen.getByTestId('home-address-label').textContent).toBe('Home'));
  });

  it('moves the mark when the other address is chosen', async () => {
    await renderAddresses(2);

    await clickHome('3 Main Road');
    await waitFor(() => expect(homes()).toEqual(['3 Main Road']));

    await clickHome('12 Kei Road');

    await waitFor(() => expect(homes()).toEqual(['12 Kei Road']));
  });

  it('keeps the mark in the database', async () => {
    await renderAddresses(2);

    await clickHome('3 Main Road');
    await waitFor(() => expect(homes()).toEqual(['3 Main Road']));

    const stored = await listAddresses(await db(), contactId);
    expect(stored.filter((address) => address.is_home === 1)).toHaveLength(1);
    expect(stored.find((address) => address.street === '3 Main Road')?.is_home).toBe(1);
  });
});