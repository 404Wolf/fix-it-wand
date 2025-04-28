import { Hono } from "https://esm.sh/hono@4.7.7?target=deno";
import { generateWorkorderEmail } from "../../workorders/generate.ts";
import { getUserByEmail } from "../../db/users.ts";
import { db } from "../../db/mod_http.ts";
import { workordersTable } from "../../db/schemas_http.ts";
import { asc, desc, eq } from "https://esm.sh/drizzle-orm@0.41.0";
import { nanoid } from "https://esm.sh/nanoid@5.1.5";
import { sendEmail } from "../../utils.ts";
import { z } from "https://esm.sh/zod@3.24.3";
import { zValidator } from "https://esm.sh/@hono/zod-validator@0.4.3?deps=hono@4.7.7,zod@3.24.3,zod@3.24.3&target=deno";
import { HTTPException } from "https://esm.sh/hono@4.7.7/http-exception?deps=hono&target=deno";
import { protectedRouteMiddleware } from "../auth/middlewares.ts";
import env from "../../env.ts";

async function findAndValidateWorkorder(
  workorderId: string,
  userId: string,
  skipOwnerCheck = false,
) {
  const workorder = await db.query.workordersTable.findFirst({
    where: eq(workordersTable.id, workorderId),
  });

  if (!workorder) {
    throw new HTTPException(404, {
      message: "Workorder not found",
    });
  }

  if (!skipOwnerCheck && workorder.owner !== userId) {
    throw new HTTPException(403, {
      message: "You do not have permission to access this workorder",
    });
  }

  return workorder;
}

export const workorderRoute = new Hono()
  .use("*", protectedRouteMiddleware({ secret: env.JWT_SECRET }))
  .post(
    "/generate",
    zValidator(
      "json",
      z.object({
        imageB64: z.string(),
        audioB64: z.string(),
        fromName: z.string(),
      }),
      async (val, c) => {
        const { imageB64, audioB64, fromName } = val.data;

        const emailContent = await generateWorkorderEmail({
          imageB64,
          audioB64,
          fromName,
        });

        return c.json({ email: emailContent }, 200);
      },
    ),
  )
  .get(
    "/",
    async (c) => {
      const jwtPayload = c.get("jwtPayload");
      const userEmail = jwtPayload.email;
      const user = await getUserByEmail(userEmail);

      const workorders = await db.query.workordersTable.findMany({
        where: eq(workordersTable.owner, user.id),
        orderBy: [
          asc(workordersTable.status),
          desc(workordersTable.createdAt),
        ],
      });

      return c.json({ workorders });
    },
  )
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        email_subject: z.string().min(1, "Email subject is required"),
        email_body: z.string().min(1, "Email body is required"),
      }),
      async (val, c) => {
        const { email_subject, email_body } = val.data;
        const jwtPayload = c.get("jwtPayload");

        const userEmail = jwtPayload.email;
        const user = await getUserByEmail(userEmail);
        const userId = user.id;

        const workorder = await db.insert(workordersTable).values({
          id: nanoid(),
          owner: userId,
          email_subject,
          email_body,
          status: "unsent",
        }).returning();

        return c.json({ workorder: workorder[0] }, 201);
      },
    ),
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({ id: z.string() }),
      async (val, c) => {
        const { id: workorderId } = val.data;
        const jwtPayload = c.get("jwtPayload");
        const userEmail = jwtPayload.email;
        const user = await getUserByEmail(userEmail);

        const workorder = await findAndValidateWorkorder(
          workorderId,
          user.id,
        );

        await sendEmail({
          to: userEmail,
          subject: workorder.email_subject,
          text: workorder.email_body,
        });

        const updatedWorkorder = await db.update(workordersTable)
          .set({ status: "pending" })
          .where(eq(workordersTable.id, workorderId))
          .returning();

        return c.json({ workorder: updatedWorkorder[0] });
      },
    ),
  )
  .post(
    "/:id/complete",
    zValidator(
      "param",
      z.object({ id: z.string() }),
      async (val, c) => {
        const jwtPayload = c.get("jwtPayload");
        const userEmail = jwtPayload.email;
        const user = await getUserByEmail(userEmail);
        const workorderId = val.data.id;

        await findAndValidateWorkorder(workorderId, user.id);

        const updatedWorkorder = await db.update(workordersTable)
          .set({ status: "done" })
          .where(eq(workordersTable.id, workorderId))
          .returning();

        return c.json({
          success: true,
          workorder: updatedWorkorder[0],
        }, 200);
      },
    ),
  )
  .delete(
    "/:id",
    zValidator(
      "param",
      z.object({ id: z.string() }),
      async (val, c) => {
        const { id: workorderId } = val.data;
        const jwtPayload = c.get("jwtPayload");
        const userEmail = jwtPayload.email;
        const user = await getUserByEmail(userEmail);

        await findAndValidateWorkorder(workorderId, user.id);

        await db.delete(workordersTable)
          .where(eq(workordersTable.id, workorderId));

        return c.json({ message: "Workorder deleted successfully" });
      },
    ),
  );
