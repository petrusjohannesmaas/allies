import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Then } from '@wdio/cucumber-framework';
import { configDir } from './app';

const DATABASE = 'allies.db';

// The app holds the file open, so a scenario reads it as a second, read-only
// connection rather than through the app.
function openDatabase() {
  const path = join(configDir(), DATABASE);
  if (!existsSync(path)) throw new Error(`No database at ${path}`);
  return new DatabaseSync(path, { readOnly: true });
}

function objects(): { type: string; name: string }[] {
  const db = openDatabase();
  try {
    // _sqlx_migrations is sqlx's own bookkeeping, not one of the app's tables.
    return db
      .prepare(
        "SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_%' ESCAPE '\\' ORDER BY type, name",
      )
      .all() as { type: string; name: string }[];
  } finally {
    db.close();
  }
}

function rowCount(db: DatabaseSync, table: string): number {
  return (db.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get() as { n: number }).n;
}

Then('the database file is in the temporary config folder', async () => {
  const path = join(configDir(), DATABASE);
  expect(path).toContain('allies-e2e-');
  if (!existsSync(path)) throw new Error(`No database at ${path}. It should be there after a first launch.`);
});

Then(/^the database has a table for (.+)$/, async (name: string) => {
  const tables = objects()
    .filter((object) => object.type === 'table')
    .map((object) => object.name);
  if (!tables.includes(name)) throw new Error(`No table for ${name}. The database holds: ${tables.join(', ')}`);
});

Then('the database has a journal view', async () => {
  const views = objects()
    .filter((object) => object.type === 'view')
    .map((object) => object.name);
  if (!views.includes('journal')) throw new Error(`No journal view. The database holds: ${views.join(', ')}`);
});

Then('every table is empty', async () => {
  const db = openDatabase();
  try {
    const tables = (
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '\\_%' ESCAPE '\\'",
        )
        .all() as { name: string }[]
    ).map((row) => row.name);
    if (tables.length === 0) throw new Error('The database has no tables at all.');

    for (const table of tables) {
      const count = rowCount(db, table);
      if (count !== 0) throw new Error(`${table} holds ${count} rows on a first run`);
    }
  } finally {
    db.close();
  }
});

Then(/^the (.+) table holds no rows$/, async (table: string) => {
  const db = openDatabase();
  try {
    const count = rowCount(db, table);
    if (count !== 0) throw new Error(`${table} holds ${count} rows`);
  } finally {
    db.close();
  }
});