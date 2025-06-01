import { client } from "./database.ts";

await client.queryArray(`
  CREATE TABLE IF NOT EXISTS allies (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL,
    basic_info JSONB NOT NULL,
    note TEXT
  )
`);

await client.queryArray(`
  CREATE TABLE IF NOT EXISTS missions (
    id SERIAL PRIMARY KEY,
    ally_id INTEGER REFERENCES allies(id) ON DELETE CASCADE,
    uuid UUID DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    due_date DATE NOT NULL
  )
`);

console.log("Migration completed!");
await client.end();