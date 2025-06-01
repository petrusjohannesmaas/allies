import "@std/dotenv/load";

const dbUrl = Deno.env.get("DATABASE_URL");
console.log(`Connected to database: ${dbUrl}`);
