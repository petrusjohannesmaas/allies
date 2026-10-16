// The only file that imports @tauri-apps/*. Everything else goes through the
// functions here, so the plugins' APIs are in one place.
import Database from '@tauri-apps/plugin-sql';
import { mkdir, readFile, remove, writeFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';

/** A connection to the database the SQL plugin opened for the app. */
export type PluginDatabase = Database;

/**
 * Opens a connection. The plugin resolves a SQLite path against the app's
 * config folder, so `sqlite:allies.db` is `~/.config/privatelink.allies/allies.db`.
 */
export function loadSqlite(connection: string): Promise<PluginDatabase> {
  return Database.load(connection);
}

/** Profile pictures live beside the database, in this folder under the config folder. */
export const PICTURES_DIR = 'pictures';

/** The path of a picture inside the config folder, which is what the capability scopes. */
export function picturePath(name: string): string {
  return `${PICTURES_DIR}/${name}`;
}

export async function writePicture(name: string, bytes: Uint8Array): Promise<void> {
  await mkdir(PICTURES_DIR, { baseDir: BaseDirectory.AppConfig, recursive: true });
  await writeFile(picturePath(name), bytes, { baseDir: BaseDirectory.AppConfig });
}

export function readPicture(name: string): Promise<Uint8Array> {
  return readFile(picturePath(name), { baseDir: BaseDirectory.AppConfig });
}

/** Removes a picture. A file that is already gone is not an error. */
export async function removePicture(name: string): Promise<void> {
  try {
    await remove(picturePath(name), { baseDir: BaseDirectory.AppConfig });
  } catch (error) {
    if (!isMissingFile(error)) throw error;
  }
}

function isMissingFile(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /not found|no such file/i.test(message);
}