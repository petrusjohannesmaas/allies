import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput, fullName } from './contacts';
import {
  addAddress,
  addChild,
  addPhone,
  addTag,
  addressIsUsable,
  deleteAddress,
  deletePhone,
  formatAddress,
  getProfileText,
  getSignificantOther,
  listAddresses,
  listChildren,
  listPhones,
  listTags,
  removeChild,
  removeTag,
  setHomeAddress,
  setProfileText,
  setSignificantOther,
} from './details';

let db: Db;
let ada: number;

beforeEach(async () => {
  db = migratedDb();
  ada = await addContact(db, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
});

/* Phone numbers */

describe('phone numbers', () => {
  it('starts with none', async () => {
    expect(await listPhones(db, ada)).toEqual([]);
  });

  it('keeps each number with its own label', async () => {
    await addPhone(db, ada, 'mobile', '082 123 4567');
    await addPhone(db, ada, 'work', '021 555 0000');
    await addPhone(db, ada, 'mobile', '083 987 6543');

    expect(await listPhones(db, ada)).toEqual([
      expect.objectContaining({ label: 'mobile', number: '082 123 4567' }),
      expect.objectContaining({ label: 'mobile', number: '083 987 6543' }),
      expect.objectContaining({ label: 'work', number: '021 555 0000' }),
    ]);
  });

  it('trims what the user typed', async () => {
    await addPhone(db, ada, '  mobile  ', '  082 123 4567  ');

    expect(await listPhones(db, ada)).toEqual([expect.objectContaining({ label: 'mobile', number: '082 123 4567' })]);
  });

  it('removes one', async () => {
    const first = await addPhone(db, ada, 'mobile', '082 123 4567');
    await addPhone(db, ada, 'work', '021 555 0000');

    await deletePhone(db, first);

    expect((await listPhones(db, ada)).map((phone) => phone.number)).toEqual(['021 555 0000']);
  });
});

/* Addresses */

describe('addresses', () => {
  it('starts with none', async () => {
    expect(await listAddresses(db, ada)).toEqual([]);
  });

  it('stores an empty part as null', async () => {
    await addAddress(db, ada, { street: '12 Kei Road', city: '', postalCode: '', country: 'South Africa' });

    expect(await listAddresses(db, ada)).toEqual([
      expect.objectContaining({ street: '12 Kei Road', city: null, postal_code: null, country: 'South Africa' }),
    ]);
  });

  it('reads as one line, skipping the parts that are empty', async () => {
    const [address] = [
      { street: '12 Kei Road', city: 'Cape Town', postal_code: '8001', country: 'South Africa', is_home: 0, id: 1, contact_id: 1 },
    ];
    expect(formatAddress(address)).toBe('12 Kei Road, Cape Town, 8001, South Africa');
  });

  it('needs one part filled in', () => {
    expect(addressIsUsable({ street: '', city: '', postalCode: '', country: '' })).toBe(false);
    expect(addressIsUsable({ street: '12 Kei Road', city: '', postalCode: '', country: '' })).toBe(true);
  });

  it('marks one address as the home address and leaves the other alone', async () => {
    const first = await addAddress(db, ada, { street: '12 Kei Road', city: '', postalCode: '', country: '' });
    const second = await addAddress(db, ada, { street: '3 Main Road', city: '', postalCode: '', country: '' });

    await setHomeAddress(db, ada, second);

    const addresses = await listAddresses(db, ada);
    expect(addresses.find((address) => address.id === second)?.is_home).toBe(1);
    expect(addresses.find((address) => address.id === first)?.is_home).toBe(0);
  });

  it('moves the home mark to another address', async () => {
    const first = await addAddress(db, ada, { street: '12 Kei Road', city: '', postalCode: '', country: '' });
    const second = await addAddress(db, ada, { street: '3 Main Road', city: '', postalCode: '', country: '' });
    await setHomeAddress(db, ada, second);

    // Backwards onto the earlier row, which is where a single UPDATE would run
    // into the one-home-address index.
    await setHomeAddress(db, ada, first);

    const addresses = await listAddresses(db, ada);
    expect(addresses.filter((address) => address.is_home === 1).map((address) => address.id)).toEqual([first]);
  });

  it('keeps a contact the home address of another', async () => {
    const other = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await setHomeAddress(db, ada, await addAddress(db, ada, { street: '12 Kei Road', city: '', postalCode: '', country: '' }));
    await setHomeAddress(db, other, await addAddress(db, other, { street: '3 Main Road', city: '', postalCode: '', country: '' }));

    expect((await listAddresses(db, other)).filter((address) => address.is_home === 1)).toHaveLength(1);
    expect((await listAddresses(db, ada)).filter((address) => address.is_home === 1)).toHaveLength(1);
  });

  it('removes one', async () => {
    const first = await addAddress(db, ada, { street: '12 Kei Road', city: '', postalCode: '', country: '' });
    await addAddress(db, ada, { street: '3 Main Road', city: '', postalCode: '', country: '' });

    await deleteAddress(db, first);

    expect(await listAddresses(db, ada)).toHaveLength(1);
  });
});

/* Children */

describe('children', () => {
  it('starts with none', async () => {
    expect(await listChildren(db, ada)).toEqual([]);
  });

  it('links a child that is an existing contact', async () => {
    const grace = await addContact(db, { ...blankInput(), firstName: 'Grace', lastName: 'Hopper' });

    await addChild(db, ada, grace);

    expect((await listChildren(db, ada)).map(fullName)).toEqual(['Grace Hopper']);
  });

  it('does not list a parent as their own child', async () => {
    await expect(addChild(db, ada, ada)).rejects.toThrow(/CHECK constraint failed/);
  });

  it('refuses the same child twice', async () => {
    const grace = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addChild(db, ada, grace);

    await expect(addChild(db, ada, grace)).rejects.toThrow(/UNIQUE constraint failed/);
  });

  it('does not make the child a parent of the parent', async () => {
    const grace = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addChild(db, ada, grace);

    expect(await listChildren(db, grace)).toEqual([]);
  });

  it('removes one', async () => {
    const grace = await addContact(db, { ...blankInput(), firstName: 'Grace' });
    await addChild(db, ada, grace);

    await removeChild(db, ada, grace);

    expect(await listChildren(db, ada)).toEqual([]);
  });
});

/* Tags */

describe('tags', () => {
  it('starts with none', async () => {
    expect(await listTags(db, ada)).toEqual([]);
  });

  it('lists tags in order', async () => {
    await addTag(db, ada, 'chess');
    await addTag(db, ada, 'books');
    await addTag(db, ada, 'cycling');

    expect(await listTags(db, ada)).toEqual(['books', 'chess', 'cycling']);
  });

  it('trims what the user typed', async () => {
    await addTag(db, ada, '  chess  ');
    expect(await listTags(db, ada)).toEqual(['chess']);
  });

  it('does not add the same tag twice', async () => {
    await addTag(db, ada, 'chess');
    await addTag(db, ada, 'chess');

    expect(await listTags(db, ada)).toEqual(['chess']);
  });

  it('removes one', async () => {
    await addTag(db, ada, 'chess');
    await addTag(db, ada, 'books');

    await removeTag(db, ada, 'chess');

    expect(await listTags(db, ada)).toEqual(['books']);
  });
});

/* The significant other */

describe('the significant other', () => {
  it('starts with none', async () => {
    expect(await getSignificantOther(db, ada)).toBeNull();
  });

  it('is picked from the contacts', async () => {
    const alan = await addContact(db, { ...blankInput(), firstName: 'Alan', lastName: 'Turing' });

    await setSignificantOther(db, ada, alan);

    expect(fullName((await getSignificantOther(db, ada))!)).toBe('Alan Turing');
  });

  it('is removed', async () => {
    const alan = await addContact(db, { ...blankInput(), firstName: 'Alan' });
    await setSignificantOther(db, ada, alan);

    await setSignificantOther(db, ada, null);

    expect(await getSignificantOther(db, ada)).toBeNull();
  });

  it('goes when that contact is deleted, leaving this one', async () => {
    const alan = await addContact(db, { ...blankInput(), firstName: 'Alan' });
    await setSignificantOther(db, ada, alan);

    await db.execute('DELETE FROM contacts WHERE id = $1', [alan]);

    expect(await getSignificantOther(db, ada)).toBeNull();
  });
});

/* The text on the contact row */

describe('how they met, work and food preferences', () => {
  it('start empty', async () => {
    expect(await getProfileText(db, ada)).toEqual({ how_met: null, work: null, food_preferences: null });
  });

  it('keep what the user typed', async () => {
    await setProfileText(db, ada, {
      how_met: 'At a conference in London',
      work: 'Mathematician',
      food_preferences: 'No shellfish',
    });

    expect(await getProfileText(db, ada)).toEqual({
      how_met: 'At a conference in London',
      work: 'Mathematician',
      food_preferences: 'No shellfish',
    });
  });

  it('store a field cleared to empty as null', async () => {
    await setProfileText(db, ada, { how_met: 'At a conference', work: null, food_preferences: null });

    await setProfileText(db, ada, { how_met: '', work: null, food_preferences: null });

    expect((await getProfileText(db, ada)).how_met).toBeNull();
  });
});