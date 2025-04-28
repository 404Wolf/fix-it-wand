import { sign } from "https://esm.sh/hono@4.7.7/jwt?deps=hono@4.7.7";
import { renderToString } from "https://esm.sh/react-dom@19.1.0/server?deps=react@19.0.0";
import { createUser, getUserByEmail } from "../../db/users.ts";
import { EmailTemplate } from "../../utils/EmailTemplate.tsx";
import { z } from "https://esm.sh/zod@3.24.3";
import { zValidator } from "https://esm.sh/@hono/zod-validator@0.4.3?deps=hono@4.7.7,zod@3.24.3";
import { Hono } from "https://esm.sh/hono@4.7.7";
import { sendEmail } from "../../utils.ts";
import env from "../../env.ts";

export const magicAuthRoute = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        email: z.string().email("Invalid email format"),
        redirectUrl: z.string().optional().default("/"),
      }),
    ),
    async (c) => {
      const { email, redirectUrl } = c.req.valid("json");

      const user = await getUserByEmail(email);
      if (!user) {
        await createUser({ email });
      }
      const token = await sign({ email }, env.JWT_SECRET);

      const magicLinkUrl = `${
        c.req.url.split("/auth")[0]
      }/auth/login?token=${token}&redirectUrl=${
        encodeURIComponent(redirectUrl)
      }`;

      const emailContent = renderToString(
        await EmailTemplate({ magicLink: magicLinkUrl }),
      );

      await sendEmail({
        to: email,
        subject: "Your Fix It Wand Magic Link",
        html: emailContent,
      }, true);

      return c.json({ message: "Magic link sent to your email", user });
    },
  );
