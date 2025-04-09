import { Hono } from "npm:hono";
import { logger } from "../index.http.ts";
import { JWT_SECRET } from "../consts.tsx";
import { generateWorkorderEmail } from "../workorders/generate.ts";
import { jwt } from "npm:hono/jwt";

export const workorderRoute = new Hono();

workorderRoute.use("*", jwt({ secret: JWT_SECRET, cookie: "auth_token" }));

workorderRoute.post("/", async (c) => {
  const payload = c.get("jwtPayload");

  logger.info(
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
    logger.error({ error }, "Error generating work order email");

    return c.json({
      success: false,
      message: "Failed to generate work order email. " + error,
    }, 500);
  }
});
