import { describe, expect, it } from 'vitest';
import {
  deletePicture,
  imageTypeOf,
  pictureName,
  savePicture,
  type ChosenFile,
  type PictureStore,
} from './pictures';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x00,
]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

/** A store that keeps files in a map, so the rules are tested without a disk. */
function fakeStore(): PictureStore & { files: Map<string, Uint8Array>; names: string[] } {
  const files = new Map<string, Uint8Array>();
  const names: string[] = [];
  return {
    files,
    names,
    async write(name, bytes) {
      files.set(name, bytes);
      names.push(`write:${name}`);
    },
    async read(name) {
      const bytes = files.get(name);
      if (!bytes) throw new Error(`no such file: ${name}`);
      return bytes;
    },
    async remove(name) {
      files.delete(name);
      names.push(`remove:${name}`);
    },
  };
}

function chosen(bytes: Uint8Array): ChosenFile {
  const type = imageTypeOf(bytes);
  if (!type) throw new Error('not an image');
  return { name: 'portrait', type, bytes };
}

const AT = new Date('2026-10-16T09:30:00Z');

describe('reading an image type from its bytes', () => {
  it.each([
    ['PNG', PNG, 'image/png'],
    ['JPEG', JPEG, 'image/jpeg'],
    ['WebP', WEBP, 'image/webp'],
    ['GIF', GIF, 'image/gif'],
  ])('recognises a %s', (_label, bytes, expected) => {
    expect(imageTypeOf(bytes)).toBe(expected);
  });

  it('rejects a file that is not an image', () => {
    expect(imageTypeOf(PDF)).toBeNull();
  });

  it('rejects a file that is too short to be anything', () => {
    expect(imageTypeOf(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});

describe('the picture file name', () => {
  it('is the contact id, the time and the extension', () => {
    expect(pictureName(7, 'image/png', AT)).toBe('7-1792143000000.png');
  });

  it('uses the extension that matches the image type', () => {
    expect(pictureName(1, 'image/jpeg', AT)).toMatch(/\.jpg$/);
    expect(pictureName(1, 'image/webp', AT)).toMatch(/\.webp$/);
    expect(pictureName(1, 'image/gif', AT)).toMatch(/\.gif$/);
  });

  it('gives two pictures of one contact different names', () => {
    const first = pictureName(7, 'image/png', new Date('2026-10-16T09:30:00Z'));
    const second = pictureName(7, 'image/png', new Date('2026-10-16T10:45:00Z'));
    expect(first).not.toBe(second);
  });

  it('refuses an image type the app does not store', () => {
    expect(() => pictureName(7, 'image/tiff', AT)).toThrow(/image\/tiff/);
  });
});

describe('saving a picture', () => {
  it('writes the bytes under the new name', async () => {
    const store = fakeStore();

    const name = await savePicture(store, 7, chosen(PNG), null, AT);

    expect(name).toBe('7-1792143000000.png');
    expect(await store.read(name)).toEqual(PNG);
  });

  it('removes the picture it replaces', async () => {
    const store = fakeStore();
    const old = await savePicture(store, 7, chosen(PNG), null, AT);

    const next = await savePicture(store, 7, chosen(JPEG), old, new Date(AT.getTime() + 60_000));

    expect(next).not.toBe(old);
    expect(store.files.has(old)).toBe(false);
    expect(store.files.has(next)).toBe(true);
  });

  it('writes only the new file when there was nothing to replace', async () => {
    const store = fakeStore();
    await savePicture(store, 7, chosen(PNG), null, AT);
    expect(store.names).toEqual(['write:7-1792143000000.png']);
  });

  it('keeps the old picture when the new one lands on the same name', async () => {
    const store = fakeStore();
    const old = await savePicture(store, 7, chosen(PNG), null, AT);

    const same = await savePicture(store, 7, chosen(PNG), old, AT);

    expect(same).toBe(old);
    expect(store.files.has(old)).toBe(true);
    expect(store.names.filter((entry) => entry.startsWith('remove:'))).toEqual([]);
  });

  it('keeps the pictures of two contacts apart', async () => {
    const store = fakeStore();
    await savePicture(store, 7, chosen(PNG), null, AT);
    await savePicture(store, 8, chosen(PNG), null, AT);

    expect([...store.files.keys()]).toEqual(['7-1792143000000.png', '8-1792143000000.png']);
  });
});

describe('deleting a picture', () => {
  it('removes the file', async () => {
    const store = fakeStore();
    const name = await savePicture(store, 7, chosen(PNG), null, AT);

    await deletePicture(store, name);

    expect(store.files.size).toBe(0);
  });

  it('needs no call when the contact has no picture', async () => {
    const store = fakeStore();
    await deletePicture(store, null);
    expect(store.names).toEqual([]);
  });
});