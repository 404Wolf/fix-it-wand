import { sign } from "npm:hono/jwt";
import { renderToString } from "npm:react-dom/server";
import { sendEmail } from "../../utils.ts";
import { JWT_SECRET } from "../../consts.tsx";
import { backendLogger } from "../../index.http.ts";
import { createUser, getUserByEmail } from "../../db/users.ts";
import { EmailTemplate } from "../../utils/EmailTemplate.tsx";
import { z } from "npm:zod";
import { zValidator } from "npm:@hono/zod-validator";
import { Hono } from "npm:hono";

export const magicLinkSchema = z.object({
  email: z.string().email("Invalid email format"),
  redirectUrl: z.string().optional().default("/"),
});

export const magicAuthRoute = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      magicLinkSchema,
      async (val, c) => {
        try {
          const { email, redirectUrl } = val.data;

          let token: string;

          const user = await getUserByEmail(email);
          if (user) {
            backendLogger.info({ email }, "User exists, sending magic link");
            token = await sign({ email }, JWT_SECRET);
          } else {
            await createUser({ email });
            token = await sign({ email }, JWT_SECRET);
          }

          const magicLinkUrl = `${
            c.req.url.split("/auth")[0]
          }/auth/login?token=${token}&redirectUrl=${
            encodeURIComponent(redirectUrl)
          }`;

          const emailContent = renderToString(
            EmailTemplate({ magicLink: magicLinkUrl }),
          );

          await sendEmail({
            to: email,
            subject: "Your Fix It Wand Magic Link",
            html: emailContent,
          }, true);

          backendLogger.info({ email }, "Magic link sent");

          return c.json({
            success: true,
            message: "Magic link sent to your email",
          }, 200);
        } catch (error) {
          backendLogger.error({ error }, "Error sending magic link");
          return c.json({
            success: false,
            message: "Failed to send magic link",
          }, 500);
        }
      },
    ),
  );
