import { Hono } from "npm:hono";
import { backendLogger } from "../index.http.ts";
import { JWT_SECRET } from "../consts.tsx";
import { generateWorkorderEmail } from "../workorders/generate.ts";
import { jwt } from "npm:hono/jwt";
import { getUserByEmail } from "../db/users.ts";
import { db } from "../db/mod_http.ts";
import { workordersTable } from "../db/schemas_http.ts";
import { asc, desc, eq } from "https://esm.sh/drizzle-orm@0.41.0";
import { nanoid } from "https://esm.sh/nanoid@5.1.5";
import { sendEmail } from "../utils.ts";

export const workorderRoute = new Hono();

workorderRoute.use("*", jwt({ secret: JWT_SECRET, cookie: "auth_token" }));

// Create a user subrouter for workorder routes
const userWorkorderRoute = new Hono();

userWorkorderRoute.post("/", async (c) => {
  const payload = c.get("jwtPayload");

  backendLogger.info(
    { email: payload.email },
    "Work order email generation request",
  );

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

// Get all workorders for the authenticated user
userWorkorderRoute.get("/", async (c) => {
  const payload = c.get("jwtPayload");
  const userEmail = payload.email;
  const user = await getUserByEmail(userEmail);

  backendLogger.info(
    { userId: user.id, email: userEmail },
    "Fetching user workorders",
  );

  try {
    // Get all workorders for the user, ordered by status (pending first) and then by creation date (newest first)
    const workorders = await db.query.workordersTable.findMany({
      where: eq(workordersTable.owner, user.id),
      orderBy: [
        // First by status (pending first)
        asc(workordersTable.status),
        // Then by creation date (newest first)
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
  const userEmail = payload.email;
  const user = await getUserByEmail(userEmail);

  backendLogger.info(
    { user_id: user.id, email: userEmail },
    "Creating new workorder",
  );

  try {
    const data = await c.req.json();
    const { email_subject, email_body } = data;

    // Manual validation
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

    // Create new workorder
    const workorder = await db.insert(workordersTable).values({
      id: nanoid(),
      owner: user.id,
      email_subject,
      email_body,
      status: "unsent", // Default status is unsent until it's sent
    }).returning();

    return c.json({
      success: true,
      workorder: workorder[0],
    }, 201);
  } catch (error) {
    backendLogger.error(
      { error, user_id: user.id },
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
  const userEmail = payload.email;
  const user = await getUserByEmail(userEmail);
  const workorderId = c.req.param("id");

  backendLogger.info(
    { userId: user.id, workorderId, email: userEmail },
    "Sending workorder",
  );

  try {
    // Get the workorder
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

    // Send the email
    await sendEmail({
      to: userEmail,
      subject: workorder.email_subject,
      text: workorder.email_body,
    });

    // Update the workorder status to pending
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

// Mark a workorder as completed
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
    // Get the workorder
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

    // Update the workorder status to done
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

// Delete a workorder
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
    // Get the workorder
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

    // Delete the workorder
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

// Mount the user workorder routes under /user
workorderRoute.route("/user", userWorkorderRoute);
