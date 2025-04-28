import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "https://esm.sh/drizzle-orm@0.41.0/pg-core";
import { InferSelectModel } from "https://esm.sh/drizzle-orm@0.41.0";

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "pending",
  "unsent",
  "done",
]);

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
  owner: text("owner_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow(),
  verified: boolean("verified").default(false),
  verificationCode: text("verification_code"),
});

export const workordersTable = pgTable("workorders", {
  id: text("id").primaryKey(),
  owner: text("owner_id").references(() => usersTable.id).notNull(),
  status: workOrderStatusEnum("status").notNull().default("pending"),
  email_subject: text("email_subject").notNull(),
  email_body: text("email_body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type User = InferSelectModel<typeof usersTable>;
export type Wand = InferSelectModel<typeof wandsTable>;
export type WorkOrder = InferSelectModel<typeof workordersTable>;
