import { beforeEach, describe, expect, it } from 'vitest';
import { migratedDb } from '../../test/sqlite-db';
import type { Db } from '../db';
import { addContact, blankInput } from './contacts';
import {
  addAddress,
  addressIsUsable,
  deleteAddress,
  formatAddress,
  getAbout,
  listAddresses,
  listTags,
  saveAbout,
  setHomeAddress,
} from './details';

let db: Db;
let ada: number;

beforeEach(async () => {
  db = migratedDb();
  ada = await addContact(db, { ...blankInput(), firstName: 'Ada', lastName: 'Lovelace' });
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

/* Tags */

describe('tags', () => {
  it('starts with none', async () => {
    expect(await listTags(db, ada)).toEqual([]);
  });
});

/* About */

const emptyAbout = { significantOtherId: null, childIds: [], howMet: '', work: '', foodPreferences: '' };

describe('About', () => {
  it('saving About writes every field and the children', async () => {
    const ann = await addContact(db, { ...blankInput(), firstName: 'Ann' });
    const ben = await addContact(db, { ...blankInput(), firstName: 'Ben' });
    const cal = await addContact(db, { ...blankInput(), firstName: 'Cal' });
    const dee = await addContact(db, { ...blankInput(), firstName: 'Dee' });
    await saveAbout(db, ada, { ...emptyAbout, childIds: [ann, ben] });

    await saveAbout(db, ada, {
      significantOtherId: cal,
      childIds: [ben, dee],
      howMet: 'At a conference',
      work: 'Mathematician',
      foodPreferences: 'No shellfish',
    });

    const about = await getAbout(db, ada);
    expect(about.work).toBe('Mathematician');
    expect(about.how_met).toBe('At a conference');
    expect(about.food_preferences).toBe('No shellfish');
    expect(about.significant_other?.id).toBe(cal);
    expect(about.children.map((child) => child.id).sort()).toEqual([ben, dee].sort());
  });

  it('a failed About save changes nothing', async () => {
    const ann = await addContact(db, { ...blankInput(), firstName: 'Ann' });
    await saveAbout(db, ada, { ...emptyAbout, childIds: [ann] });

    await expect(
      saveAbout(db, ada, { significantOtherId: null, childIds: [ada], howMet: '', work: 'Changed', foodPreferences: '' }),
    ).rejects.toThrow(/CHECK constraint failed/);

    const about = await getAbout(db, ada);
    expect(about.children.map((child) => child.id)).toEqual([ann]);
    expect(about.work).toBeNull();
  });
});
