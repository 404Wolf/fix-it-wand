import { Hono } from "https://esm.sh/hono@4.7.7";
import { HTTPException } from "https://esm.sh/hono@4.7.7/http-exception?deps=hono@4.7.7";
import { z } from "https://esm.sh/zod@3.24.3";
import { zValidator } from "https://esm.sh/@hono/zod-validator@0.4.3?deps=hono@4.7.7,zod@3.24.3";
import { getUserByEmail } from "../../db/users.ts";
import { wandsTable } from "../../db/schemas_http.ts";
import { db } from "../../db/mod_http.ts";
import {
  generatePassphrase,
  wordsStartsWith,
} from "https://esm.town/v/wolf/PassphraseAPI@27-main/mod.ts";
import { protectedRouteMiddleware } from "../auth/middlewares.ts";
import env from "../../env.ts";
import { eq } from "https://esm.sh/drizzle-orm@0.41.0";

const VERIFICATION_CODE_LENGTH = 6;

function assertWandBelongsToUser(
  wand: { owner: string },
  userId: string,
): asserts wand is { owner: string } {
  if (wand.owner !== userId) {
    throw new HTTPException(403, {
      message: "This wand does not belong to you",
    });
  }
}

export const wandsRoute = new Hono()
  .use("*", protectedRouteMiddleware({ secret: env.JWT_SECRET }))
  .get("/associate", async (c) => {
    const jwtPayload = c.get("jwtPayload");
    const userEmail = jwtPayload.email;
    const user = await getUserByEmail(userEmail);

    // Check if user already has an unverified wand
    const existingWands = await db
      .select()
      .from(wandsTable)
      .where(eq(wandsTable.owner, user.id))
      .execute();

    // Find an unverified wand if it exists
    const unverifiedWand = existingWands.find((wand) => !wand.verified);

    if (unverifiedWand) {
      return c.json({
        wandId: unverifiedWand.id,
        verificationCode: unverifiedWand.verificationCode!,
        mnemonic: unverifiedWand.verificationCode!
          .split("")
          .map((char) => wordsStartsWith(char)[0])
          .join(" "),
        verified: unverifiedWand.verified!,
      });
    }

    // Create a passphrase for verification
    const passphrase = generatePassphrase(VERIFICATION_CODE_LENGTH, "-");

    // Create a new wand that is owned by the user, but is not "verified"
    const newWand = await db
      .insert(wandsTable)
      .values({
        id: crypto.randomUUID(),
        owner: user.id,
        verified: false,
        verificationCode: passphrase,
      })
      .returning()
      .execute();

    return c.json({
      wandId: newWand[0].id!,
      verificationCode: newWand[0].verificationCode!,
      mnemonic: newWand[0]
        .verificationCode!
        .split("")
        .map((char) => wordsStartsWith(char)[0])
        .join(" ")!,
      verified: newWand[0].verified!,
    });
  })
  .post(
    "/associate",
    zValidator(
      "json",
      z.object({
        wandId: z.string().uuid(),
        verificationCode: z.string(),
      }),
    ),
    async (c) => {
      const jwtPayload = c.get("jwtPayload");
      const userEmail = jwtPayload.email;
      const user = await getUserByEmail(userEmail);

      // Get the validated data from the request body
      const { wandId, verificationCode } = c.req.valid("json");

      // Find the wand
      const wand = await db
        .select()
        .from(wandsTable)
        .where(eq(wandsTable.id, wandId))
        .execute();

      if (wand.length === 0) return c.notFound();

      const targetWand = wand[0];

      assertWandBelongsToUser(targetWand as { owner: string }, user.id);

      // Check if the wand is already verified
      if (targetWand.verified) {
        throw new HTTPException(400, {
          message: "This wand is already verified",
        });
      }

      // Check if the verification code matches
      if (targetWand.verificationCode !== verificationCode) {
        throw new HTTPException(400, { message: "Invalid verification code" });
      }

      // Update the wand to be verified
      const updatedWand = await db
        .update(wandsTable)
        .set({ verified: true })
        .where(eq(wandsTable.id, wandId))
        .returning()
        .execute();

      return c.json({
        wandId: updatedWand[0].id,
        verified: updatedWand[0].verified,
        message: "Wand successfully associated",
      });
    },
  )
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.string().uuid() })),
    async (c) => {
      const jwtPayload = c.get("jwtPayload");
      const userEmail = jwtPayload.email;
      const user = await getUserByEmail(userEmail);

      const wandId = c.req.valid("param").id;

      const wand = await db
        .select()
        .from(wandsTable)
        .where(eq(wandsTable.id, wandId))
        .execute();

      if (wand.length === 0) return c.notFound();

      const targetWand = wand[0];

      assertWandBelongsToUser(targetWand as { owner: string }, user.id);

      return c.json({
        id: targetWand.id,
        verified: targetWand.verified,
        verificationCode: targetWand.verificationCode,
        createdAt: targetWand.createdAt,
        owner: targetWand.owner,
      });
    },
  );
