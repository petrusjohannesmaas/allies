import { route, type Route } from "@std/http/unstable-route";
import { getAllAllies, insertAlly } from "../database/db_helpers.ts";

const routes: Route[] = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/allies" }),
    handler: async () => {
      try {
        const allies = await getAllAllies();
        return new Response(JSON.stringify(allies), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      } catch (error) {
        console.error("Error retrieving allies:", error);
        return new Response("Internal Server Error", { status: 500 });
      }
    },
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/allies" }),
    handler: async (req: Request) => {
      try {
        const body = await req.json().catch(() => null);
        if (!body) return new Response("Invalid JSON format", { status: 400 });

        const newAllyId = await insertAlly(body);
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

function defaultHandler(_req: Request) {
  return new Response("Not Found", { status: 404 });
}

Deno.serve(route(routes, defaultHandler));

console.log("Server running at http://localhost:8000/");
