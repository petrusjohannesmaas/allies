import { Client } from "jsr:@db/postgres";
import "@std/dotenv/load";

const client = new Client({
  user: Deno.env.get("DB_USER"),
  database: Deno.env.get("DB_NAME"),
  password: Deno.env.get("DB_PASSWORD"),
  hostname: Deno.env.get("DB_HOST"),
  port: Number(Deno.env.get("DB_PORT")),
});

await client.connect();

export { client };
