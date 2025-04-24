import { Hono } from "npm:hono";
import { backendLogger } from "../index.http.ts";
import { JWT_SECRET } from "../consts.tsx";
import { generateWorkorderEmail } from "../workorders/generate.ts";
import { jwtOrMasterAuth } from "./auth.tsx";
import { getUserByEmail } from "../db/users.ts";
import { db } from "../db/mod_http.ts";
import { workordersTable } from "../db/schemas_http.ts";
import { asc, desc, eq } from "https://esm.sh/drizzle-orm@0.41.0";
import { nanoid } from "https://esm.sh/nanoid@5.1.5";
import { sendEmail } from "../utils.ts";

export const workorderRoute = new Hono();

workorderRoute.use(
  "*",
  jwtOrMasterAuth({ secret: JWT_SECRET, cookie: "auth_token" }),
);

// Generates a workorder
workorderRoute.post("/generate", async (c) => {
  try {
    const body = await c.req.json();
    const { imageB64, audioB64, fromName } = body;

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
    backendLogger.error({ error }, "Error generating work order email");

    return c.json({
      success: false,
      message: "Failed to generate work order email. " + error,
    }, 500);
  }
});

const userWorkorderRoute = new Hono();

// Get all workorders for the authenticated user
userWorkorderRoute.get("/", async (c) => {
  const payload = c.get("jwtPayload");

  if (payload.isMasterToken) {
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

  const userEmail = payload.email;
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
});

// Create a new workorder
userWorkorderRoute.post("/", async (c) => {
  const payload = c.get("jwtPayload");
  let userId;

  if (payload.isMasterToken) {
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
    const userEmail = payload.email;
    const user = await getUserByEmail(userEmail);
    userId = user.id;

    backendLogger.info(
      { userId, email: userEmail },
      "Creating new workorder",
    );
  }

  try {
    const data = await c.req.json();
    const { email_subject, email_body } = data;

    if (!email_subject || email_subject.trim() === "") {
      return c.json({
        success: false,
        message: "Email subject is required",
      }, 400);
    }

    if (!email_body || email_body.trim() === "") {
      return c.json({
        success: false,
        message: "Email body is required",
      }, 400);
    }

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
    backendLogger.error(
      { error, userId },
      "Error creating workorder",
    );

    return c.json({
      success: false,
      message: "Failed to create workorder: " + error,
    }, 500);
  }
});

// Send a workorder to the specified email
userWorkorderRoute.post("/:id/send", async (c) => {
  const payload = c.get("jwtPayload");
  const workorderId = c.req.param("id");

  if (payload.isMasterToken) {
    backendLogger.info(
      { workorderId, isMasterToken: true },
      "Sending workorder with master token",
    );

    try {
      const workorder = await db.query.workordersTable.findFirst({
        where: eq(workordersTable.id, workorderId),
      });

      if (!workorder) {
        return c.json({
          success: false,
          message: "Workorder not found",
        }, 404);
      }

      let toEmail = "wolf@fixitwand.val.run";
      try {
        const owner = await db.query.usersTable.findFirst({
          where: eq(db.query.usersTable.fields.id, workorder.owner),
        });
        if (owner?.email) {
          toEmail = owner.email;
        }
      } catch (err) {
        backendLogger.warn(
          { err, workorderId },
          "Could not find owner email, using default",
        );
      }

      await sendEmail({
        to: toEmail,
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
    } catch (error) {
      backendLogger.error(
        { error, workorderId },
        "Error sending workorder with master token",
      );

      return c.json({
        success: false,
        message: "Failed to send workorder: " + error,
      }, 500);
    }
  }

  const userEmail = payload.email;
  const user = await getUserByEmail(userEmail);

  backendLogger.info(
    { userId: user.id, workorderId, email: userEmail },
    "Sending workorder",
  );

  try {
    const workorder = await db.query.workordersTable.findFirst({
      where: eq(workordersTable.id, workorderId),
    });

    if (!workorder) {
      return c.json({
        success: false,
        message: "Workorder not found",
      }, 404);
    }

    if (workorder.owner !== user.id) {
      return c.json({
        success: false,
        message: "Unauthorized: You don't own this workorder",
      }, 403);
    }

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
  } catch (error) {
    backendLogger.error(
      { error, userId: user.id, workorderId },
      "Error sending workorder",
    );

    return c.json({
      success: false,
      message: "Failed to send workorder: " + error,
    }, 500);
  }
});

userWorkorderRoute.post("/:id/complete", async (c) => {
  const payload = c.get("jwtPayload");
  const userEmail = payload.email;
  const user = await getUserByEmail(userEmail);
  const workorderId = c.req.param("id");

  backendLogger.info(
    { userId: user.id, workorderId, email: userEmail },
    "Marking workorder as completed",
  );

  try {
    const workorder = await db.query.workordersTable.findFirst({
      where: eq(workordersTable.id, workorderId),
    });

    if (!workorder) {
      return c.json({
        success: false,
        message: "Workorder not found",
      }, 404);
    }

    if (workorder.owner !== user.id) {
      return c.json({
        success: false,
        message: "Unauthorized: You don't own this workorder",
      }, 403);
    }

    const updatedWorkorder = await db.update(workordersTable)
      .set({ status: "done" })
      .where(eq(workordersTable.id, workorderId))
      .returning();

    return c.json({
      success: true,
      workorder: updatedWorkorder[0],
    }, 200);
  } catch (error) {
    backendLogger.error(
      { error, userId: user.id, workorderId },
      "Error completing workorder",
    );

    return c.json({
      success: false,
      message: "Failed to complete workorder: " + error,
    }, 500);
  }
});

userWorkorderRoute.delete("/:id", async (c) => {
  const payload = c.get("jwtPayload");
  const userEmail = payload.email;
  const user = await getUserByEmail(userEmail);
  const workorderId = c.req.param("id");

  backendLogger.info(
    { userId: user.id, workorderId, email: userEmail },
    "Deleting workorder",
  );

  try {
    const workorder = await db.query.workordersTable.findFirst({
      where: eq(workordersTable.id, workorderId),
    });

    if (!workorder) {
      return c.json({
        success: false,
        message: "Workorder not found",
      }, 404);
    }

    if (workorder.owner !== user.id) {
      return c.json({
        success: false,
        message: "Unauthorized: You don't own this workorder",
      }, 403);
    }

    await db.delete(workordersTable)
      .where(eq(workordersTable.id, workorderId));

    return c.json({
      success: true,
      message: "Workorder deleted successfully",
    }, 200);
  } catch (error) {
    backendLogger.error(
      { error, userId: user.id, workorderId },
      "Error deleting workorder",
    );

    return c.json({
      success: false,
      message: "Failed to delete workorder: " + error,
    }, 500);
  }
});

workorderRoute.route("/user", userWorkorderRoute);
