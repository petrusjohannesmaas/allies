import { client } from "./database.ts";

await client.queryArray("DROP TABLE IF EXISTS allies CASCADE");
await client.queryArray("DROP TABLE IF EXISTS missions CASCADE");

await client.queryArray(`
CREATE TABLE allies (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  fname TEXT NOT NULL,
  lname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  birthday DATE NOT NULL,
  pfp TEXT,
  note TEXT
);
`);

await client.queryArray(`
CREATE TABLE missions (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ally_id INT REFERENCES allies(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  due_date DATE NOT NULL
);
`);

console.log("Migration completed!");
await client.end();
