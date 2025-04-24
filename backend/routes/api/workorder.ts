import { Hono } from "npm:hono";
import { backendLogger } from "../../index.http.ts";
import { JWT_SECRET } from "../../consts.tsx";
import { generateWorkorderEmail } from "../../workorders/generate.ts";
import { getUserByEmail } from "../../db/users.ts";
import { db } from "../../db/mod_http.ts";
import { workordersTable } from "../../db/schemas_http.ts";
import { asc, desc, eq } from "https://esm.sh/drizzle-orm@0.41.0";
import { nanoid } from "https://esm.sh/nanoid@5.1.5";
import { sendEmail } from "../../utils.ts";
import { z } from "npm:zod";
import { zValidator } from "npm:@hono/zod-validator";
import { HTTPException } from "npm:hono/http-exception";
import { jwtOrMasterAuth } from "../auth/middlewares.ts";

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
  .use(
    "*",
    jwtOrMasterAuth({ secret: JWT_SECRET, cookie: "auth_token" }),
  )
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
        try {
          const { imageB64, audioB64, fromName } = val.data;

          const emailContent = await generateWorkorderEmail({
            imageB64,
            audioB64,
            fromName,
          });

          return c.json({
            success: true,
            email: emailContent,
          });
        } catch (error) {
          backendLogger.error({ error }, "Failed to generate work order email");

          return c.json({
            success: false,
            message: "Failed to generate work order email. " + error,
          }, 500);
        }
      },
    ),
  )
  .get(
    "/",
    zValidator(
      "json",
      z.object({
        jwtPayload: z.object({
          email: z.string().email().optional(),
          isMasterToken: z.boolean().optional(),
        }),
      }),
      async (val, c) => {
        const { jwtPayload } = val.data;

        if (jwtPayload.isMasterToken) {
          try {
            const workorders = await db.query.workordersTable.findMany({
              orderBy: [
                asc(workordersTable.status),
                desc(workordersTable.createdAt),
              ],
            });

            return c.json({
              success: true,
              workorders,
            }, 200);
          } catch (error) {
            backendLogger.error(
              { error },
              "Error fetching all workorders with master token",
            );

            return c.json({
              success: false,
              message: "Failed to fetch workorders: " + error,
            }, 500);
          }
        }

        if (!jwtPayload.email) {
          throw new HTTPException(401, { message: "No email in token" });
        }

        const userEmail = jwtPayload.email;
        const user = await getUserByEmail(userEmail);

        backendLogger.info(
          { userId: user.id, email: userEmail },
          "Fetching user workorders",
        );

        try {
          const workorders = await db.query.workordersTable.findMany({
            where: eq(workordersTable.owner, user.id),
            orderBy: [
              asc(workordersTable.status),
              desc(workordersTable.createdAt),
            ],
          });

          return c.json({
            success: true,
            workorders,
          }, 200);
        } catch (error) {
          backendLogger.error(
            { error, userId: user.id },
            "Error fetching user workorders",
          );

          return c.json({
            success: false,
            message: "Failed to fetch workorders: " + error,
          }, 500);
        }
      },
    ),
  )
  .post(
    zValidator(
      "json",
      z.object({
        email_subject: z.string().min(1, "Email subject is required"),
        email_body: z.string().min(1, "Email body is required"),
        jwtPayload: z.object({
          email: z.string().email().optional(),
          isMasterToken: z.boolean().optional(),
        }),
      }),
      async (val, c) => {
        const { email_subject, email_body, jwtPayload } = val.data;
        let userId;

        if (jwtPayload.isMasterToken) {
          try {
            const firstUser = await db.query.usersTable.findFirst();
            userId = firstUser?.id || "system";

            backendLogger.info(
              { userId, isMasterToken: true },
              "Creating new workorder with master token",
            );
          } catch (error) {
            backendLogger.error(
              { error },
              "Error finding first user for master token",
            );
            userId = "system";
          }
        } else {
          if (!jwtPayload.email) {
            throw new HTTPException(401, { message: "No email in token" });
          }

          const userEmail = jwtPayload.email;
          const user = await getUserByEmail(userEmail);
          userId = user.id;

          backendLogger.info(
            { userId, email: userEmail },
            "Creating new workorder",
          );
        }

        try {
          const workorder = await db.insert(workordersTable).values({
            id: nanoid(),
            owner: userId,
            email_subject,
            email_body,
            status: "unsent",
          }).returning();

          return c.json({
            success: true,
            workorder: workorder[0],
          }, 201);
        } catch (error) {
          backendLogger.error({ error, userId }, "Error creating workorder");

          return c.json({
            success: false,
            message: "Failed to create workorder: " + error,
          }, 500);
        }
      },
    ),
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string(),
        jwtPayload: z.object({
          email: z.string().email().optional(),
          isMasterToken: z.boolean().optional(),
        }),
      }),
      async (val, c) => {
        const { id: workorderId, jwtPayload } = val.data;

        if (!jwtPayload.email) {
          throw new HTTPException(401, { message: "No email in token" });
        }

        const userEmail = jwtPayload.email;
        const user = await getUserByEmail(userEmail);

        backendLogger.info(
          { userId: user.id, workorderId, email: userEmail },
          "Sending workorder",
        );

        try {
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

          return c.json({
            success: true,
            workorder: updatedWorkorder[0],
          }, 200);
        } catch (e) {
          backendLogger.error(
            { error: e, userId: user.id, workorderId },
            "Error sending workorder",
          );

          return c.json({
            success: false,
            message: "Failed to send workorder: " + e,
          }, 500);
        }
      },
    ),
  )
  .post("/:id/complete", async (c) => {
    const payload = c.get("jwtPayload");
    const userEmail = payload.email;
    const user = await getUserByEmail(userEmail);
    const workorderId = c.req.param("id");

    backendLogger.info(
      { userId: user.id, workorderId, email: userEmail },
      "Marking workorder as completed",
    );

    try {
      // Makes sure that the workorder exists and implicitly will throw an error if it doesn't
      await findAndValidateWorkorder(workorderId, user.id);

      const updatedWorkorder = await db.update(workordersTable)
        .set({ status: "done" })
        .where(eq(workordersTable.id, workorderId))
        .returning();

      return c.json({
        success: true,
        workorder: updatedWorkorder[0],
      }, 200);
    } catch (e) {
      backendLogger.error(
        { error: e, userId: user.id, workorderId },
        "Error completing workorder",
      );

      return c.json({
        success: false,
        message: "Failed to complete workorder: " + e,
      }, 500);
    }
  })
  .delete("/:id", async (c) => {
    const payload = c.get("jwtPayload");
    const userEmail = payload.email;
    const user = await getUserByEmail(userEmail);
    const workorderId = c.req.param("id");

    backendLogger.info(
      { userId: user.id, workorderId, email: userEmail },
      "Deleting workorder",
    );

    try {
      // Makes sure that the workorder exists and implicitly will throw an error if it doesn't
      await findAndValidateWorkorder(workorderId, user.id);

      await db.delete(workordersTable)
        .where(eq(workordersTable.id, workorderId));

      return c.json({
        success: true,
        message: "Workorder deleted successfully",
      });
    } catch (e) {
      backendLogger.error(
        { error: e, userId: user.id, workorderId },
        "Error deleting workorder",
      );

      return c.json({
        success: false,
        message: "Failed to delete workorder: " + e,
      }, 500);
    }
  });
