import { readPicture, removePicture, writePicture } from '../platform';

/** The extension each image type is stored under, and the type each extension is read back as. */
export const IMAGE_EXTENSIONS: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

const TYPE_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(IMAGE_EXTENSIONS).map(([extension, type]) => [type, extension]),
);

/** The types the file input offers. */
export const ACCEPTED_TYPES = Object.keys(TYPE_BY_EXTENSION);

/** What the form hands over. The type is read from the file's own bytes, not from its name. */
export interface ChosenFile {
  name: string;
  type: string;
  bytes: Uint8Array;
}

/**
 * Where pictures are kept. The app passes the plugin-backed store; the tests
 * pass a map, so the naming rules are tested without touching the disk.
 */
export interface PictureStore {
  write(name: string, bytes: Uint8Array): Promise<void>;
  read(name: string): Promise<Uint8Array>;
  remove(name: string): Promise<void>;
}

export const pictureStore: PictureStore = { write: writePicture, read: readPicture, remove: removePicture };

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * The image type a file holds, read from the bytes every format starts with.
 * A browser reports a type from the file's name, which a rename can change, so
 * the bytes are what decides.
 */
export function imageTypeOf(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && PNG.every((byte, index) => bytes[index] === byte)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && ascii(bytes, 0, 'RIFF') && ascii(bytes, 8, 'WEBP')) return 'image/webp';
  if (bytes.length >= 6 && ascii(bytes, 0, 'GIF8')) return 'image/gif';
  return null;
}

function ascii(bytes: Uint8Array, from: number, text: string): boolean {
  return text.split('').every((character, offset) => bytes[from + offset] === character.charCodeAt(0));
}

/**
 * The file name the contact row keeps. The contact id keeps one contact's
 * pictures apart, and the time keeps a replacement from overwriting the file
 * the row still points at.
 */
export function pictureName(contactId: number, imageType: string, at: Date): string {
  const extension = TYPE_BY_EXTENSION[imageType];
  if (!extension) throw new Error(`Not an image type the app stores: ${imageType}`);
  return `${contactId}-${at.getTime()}.${extension}`;
}

/**
 * Writes a picture and removes the one it replaces. Returns the new name, which
 * is all the contact row keeps.
 */
export async function savePicture(
  store: PictureStore,
  contactId: number,
  file: ChosenFile,
  previous: string | null,
  at: Date,
): Promise<string> {
  const name = pictureName(contactId, file.type, at);
  await store.write(name, file.bytes);
  if (previous && previous !== name) await store.remove(previous);
  return name;
}

/** Removes a contact's picture. A contact with no picture needs no call. */
export async function deletePicture(store: PictureStore, name: string | null): Promise<void> {
  if (!name) return;
  await store.remove(name);
}

/**
 * The bytes as an object URL for an `<img>`. The asset protocol stays off, so
 * the screen reads the file itself.
 */
export function pictureUrl(bytes: Uint8Array, type: string): string {
  return URL.createObjectURL(new Blob([new Uint8Array(bytes).buffer], { type }));
}