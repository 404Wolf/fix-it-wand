import {
  boolean,
  pgTable,
  text,
  timestamp,
} from "https://esm.sh/drizzle-orm@0.41.0/pg-core";
import { InferSelectModel } from "https://esm.sh/drizzle-orm@0.41.0";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const wandsTable = pgTable("wands", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  core: text("core").notNull(),
  owner: text("owner_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = InferSelectModel<typeof usersTable>;
export type Wand = InferSelectModel<typeof wandsTable>;
