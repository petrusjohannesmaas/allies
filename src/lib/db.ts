import { loadSqlite, type PluginDatabase } from './platform';

/** What a statement that changes rows reports back. */
export interface ExecuteResult {
  rowsAffected: number;
  lastInsertId: number;
}

/**
 * The two ways the app reads and writes. Screens, repositories and the data
 * tests all speak this, so a test can put a real SQLite database behind the
 * same interface the plugin provides.
 *
 * Placeholders are `$1`, `$2` and so on, and `bind` lists their values in
 * order.
 */
export interface Db {
  select<T>(sql: string, bind?: readonly unknown[]): Promise<T[]>;
  execute(sql: string, bind?: readonly unknown[]): Promise<ExecuteResult>;
}

/** The plugin resolves this against the app's config folder. */
export const CONNECTION = 'sqlite:allies.db';

export function pluginDb(database: PluginDatabase): Db {
  return {
    select: (sql, bind) => database.select(sql, bind ? [...bind] : []),
    execute: async (sql, bind) => {
      const result = await database.execute(sql, bind ? [...bind] : []);
      return { rowsAffected: result.rowsAffected, lastInsertId: result.lastInsertId ?? 0 };
    },
  };
}

let connection: Promise<Db> | undefined;

/** The app's one connection, opened the first time a screen asks for it. */
export function db(): Promise<Db> {
  connection ??= loadSqlite(CONNECTION).then(pluginDb);
  return connection;
}

/**
 * Puts a connection in place of the plugin's, so a test or a screen can use a
 * database it made itself. Passing nothing restores the plugin.
 */
export function setDb(replacement: Db | undefined): void {
  connection = replacement ? Promise.resolve(replacement) : undefined;
}