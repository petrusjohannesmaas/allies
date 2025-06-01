import { type Route } from "@std/http/unstable-route";
import { insertAlly } from "../database/db_helpers.ts";

export const alliesRoutes: Route[] = [
  // Insert a new ally
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/allies" }),
    handler: async (req: Request) => {
      try {
        const body = await req.json().catch(() => null);
        if (!body || !body.category || !body.fname || !body.lname || !body.email || !body.birthday || !body.note) {
          return new Response("Invalid JSON format or missing fields", { status: 400 });
        }

        const newAllyId = await insertAlly({
          category: body.category,
          fname: body.fname,
          lname: body.lname,
          email: body.email,
          birthday: new Date(body.birthday),
          pfp: body.pfp || null,
          note: body.note,
        });

        return new Response(JSON.stringify({ id: newAllyId }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });

      } catch (error) {
        console.error("Error inserting ally:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    },
  },
];
