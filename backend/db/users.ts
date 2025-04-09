import { db } from "./mod_http.ts";
import { usersTable } from "./schemas_http.ts";
import { eq } from "https://esm.sh/drizzle-orm@0.41.0";
import { nanoid } from "https://esm.sh/nanoid@5.1.5";

type CreateUserParams = {
  email: string;
  emailVerified?: boolean;
  firstName?: string;
  lastName?: string;
};

// Get user by email
export async function getUserByEmail(email: string) {
  const users = await db.select().from(usersTable).where(
    eq(usersTable.email, email),
  );

  return users[0] || null;
}

// Get user by ID
export async function getUserById(id: string) {
  const users = await db.select().from(usersTable).where(
    eq(usersTable.id, id),
  );

  return users[0] || null;
}

// Update user
export async function updateUser(
  id: string,
  updates: Partial<Omit<typeof usersTable.$inferInsert, "id">>,
) {
  await db.update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id));

  // Fetch and return the updated user
  return getUserById(id);
}

// Create new user
export async function createUser(
  { email, emailVerified = false, firstName = "", lastName = "" }:
    CreateUserParams,
) {
  const userId = nanoid();

  await db.insert(usersTable).values({
    id: userId,
    email,
    firstName,
    lastName,
    emailVerified,
  });

  return {
    id: userId,
    email,
    firstName,
    lastName,
    emailVerified,
    createdAt: new Date(), // Assuming createdAt is a field in your usersTable
  };
}
