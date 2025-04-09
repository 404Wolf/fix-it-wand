import { drizzle } from "https://esm.sh/drizzle-orm@0.41.0/neon-http";
import { neon } from "https://esm.sh/@neondatabase/serverless@1.0.0";
import { usersTable, wandsTable, workordersTable } from "./schemas_http.ts";

// Initialize the Neon SQL client
const sql = neon(Deno.env.get("DATABASE_URL")!);

// Instantiate Drizzle client with the Neon driver and schemas
export const db = drizzle(sql, {
  schema: { usersTable, wandsTable, workordersTable },
});
