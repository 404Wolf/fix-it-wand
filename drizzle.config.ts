import { defineConfig } from "drizzle-kit";
import process from "node:process";

export default defineConfig({
  dialect: "postgresql",
  schema: "./backend/db/schemas.ts",
  out: "./backend/drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
