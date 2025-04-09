import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
