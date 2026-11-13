import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { Db, ExecuteResult } from '../lib/db';

const MIGRATIONS_DIR = resolve(process.cwd(), 'src-tauri/migrations');

/** Every migration file, oldest first, read straight from the folder the app ships. */
export function migrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => readFileSync(join(MIGRATIONS_DIR, name), 'utf8'));
}

/**
 * A Db over an in-memory SQLite database. Node binds `$1`, `$2` and so on as
 * named parameters.
 */
export function sqliteDb(): Db {
  return connect().db;
}

/**
 * A Db over an in-memory SQLite database with the app's schema applied, read
 * from the same migration files the app runs. A migration holds many
 * statements, so it goes through exec, which takes them all.
 */
export function migratedDb(): Db {
  const { database, db } = connect();
  for (const sql of migrationFiles()) database.exec(sql);
  return db;
}

/**
 * A database that applies the migration files one at a time, so a test can put
 * data in the old schema before the migration that changes it runs.
 */
export function steppedDb(): { db: Db; applyMigration: (index: number) => void } {
  const { database, db } = connect();
  const files = migrationFiles();
  return { db, applyMigration: (index) => database.exec(files[index]) };
}

function connect(): { database: DatabaseSync; db: Db } {
  const database = new DatabaseSync(':memory:');
  // sqlx turns foreign keys on by default, so the cascades and the rules these
  // tests rely on are on here too.
  database.exec('PRAGMA foreign_keys = ON;');

  return {
    database,
    db: {
      async select<T>(sql: string, bind: readonly unknown[] = []): Promise<T[]> {
        return database.prepare(sql).all(named(bind)) as T[];
      },
      async execute(sql: string, bind: readonly unknown[] = []): Promise<ExecuteResult> {
        const result = database.prepare(sql).run(named(bind));
        return { rowsAffected: Number(result.changes), lastInsertId: Number(result.lastInsertRowid) };
      },
    },
  };
}

function named(bind: readonly unknown[]): Record<string, SQLInputValue> {
  return Object.fromEntries(bind.map((value, index) => [`$${index + 1}`, value as SQLInputValue]));
}