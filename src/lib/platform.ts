// The only file that imports @tauri-apps/*. Everything else goes through the
// functions here, so the plugins' APIs are in one place.
import Database from '@tauri-apps/plugin-sql';
import { mkdir, readFile, remove, writeFile } from '@tauri-apps/plugin-fs';
import { appConfigDir, BaseDirectory, join } from '@tauri-apps/api/path';
import { LazyStore } from '@tauri-apps/plugin-store';

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
export type SavedSettings = {
  theme?: unknown;
  accent?: unknown;
};

// The store opens on first use, at an absolute path in the config folder next
// to allies.db.
let store: LazyStore | undefined;

async function settingsStore(): Promise<LazyStore> {
  if (!store) {
    store = new LazyStore(await join(await appConfigDir(), 'settings.json'), { autoSave: false, defaults: {} });
  }
  return store;
}

export async function loadSettings(): Promise<SavedSettings> {
  const settingsFile = await settingsStore();
  const [theme, accent] = await Promise.all([settingsFile.get('theme'), settingsFile.get('accent')]);
  return { theme, accent };
}

export async function saveSettings(values: { theme: string; accent: string }): Promise<void> {
  const settingsFile = await settingsStore();
  await settingsFile.set('theme', values.theme);
  await settingsFile.set('accent', values.accent);
  await settingsFile.save();
}
