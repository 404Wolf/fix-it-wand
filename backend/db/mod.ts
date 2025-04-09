import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { usersTable, wandsTable } from "./schemas.ts";

// Initialize the Neon SQL client
const sql = neon(Deno.env.get("DATABASE_URL")!);

// Instantiate Drizzle client with the Neon driver and schemas
export const db = drizzle(sql, {
  schema: { usersTable, wandsTable },
});
