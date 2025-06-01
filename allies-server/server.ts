import { route } from "@std/http/unstable-route";
import { alliesRoutes } from "./routes/allies.ts";

const allRoutes = [...alliesRoutes];

function defaultHandler(_req: Request) {
  return new Response("Not Found", { status: 404 });
}

console.log("Server running on http://localhost:8000/");
Deno.serve(route(allRoutes, defaultHandler));