import { Context, Hono } from "https://esm.sh/hono@4.7.7?target=deno";
import { setCookie } from "https://esm.sh/hono@4.7.7/cookie?deps=hono&target=deno";
import { sign } from "https://esm.sh/hono@4.7.7/jwt?deps=hono@4.7.7?target=deno";
import { z } from "https://esm.sh/zod@3.24.3";
import { zValidator } from "https://esm.sh/@hono/zod-validator@0.4.3?deps=hono@4.7.7,zod@3.24.3&target=deno";
import { verifyJwt } from "./utils.ts";
import env from "../../env.ts";

const JWT_COOKIE_EXPIRATION = 60 * 60 * 24 * 7;

export const loginRoute = new Hono()
  .get(
    "/login",
    zValidator(
      "query",
      z.object({
        token: z.string(),
        redirectUrl: z.string().optional().default("/"),
      }),
      async (val, c) => {
        const { token, redirectUrl } = val.data;
        console.log("Token:", token);
        console.log("Redirect URL:", redirectUrl);
        const { email } = await verifyJwt(token, env.JWT_SECRET);

        const jwt = await sign({ email }, env.JWT_SECRET);

        setCookie(c, "auth_token", jwt, {
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          maxAge: JWT_COOKIE_EXPIRATION,
          path: "/",
        });

        return c.redirect(redirectUrl);
      },
    ),
  )
  .post("/logout", (c: Context) => {
    setCookie(c, "auth_token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      expires: new Date(0),
      path: "/",
    });

    return c.json({ success: true, message: "Logged out successfully" }, 200);
  });
