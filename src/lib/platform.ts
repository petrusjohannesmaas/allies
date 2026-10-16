// The only file that imports @tauri-apps/*. Everything else goes through the
// functions here, so the plugin's API is in one place.
import Database from '@tauri-apps/plugin-sql';

/** A connection to the database the SQL plugin opened for the app. */
export type PluginDatabase = Database;

/**
 * Opens a connection. The plugin resolves a SQLite path against the app's
 * config folder, so `sqlite:allies.db` is `~/.config/privatelink.allies/allies.db`.
 */
export function loadSqlite(connection: string): Promise<PluginDatabase> {
  return Database.load(connection);
}