import { Context } from "npm:hono";
import { setCookie } from "npm:hono/cookie";
import { sign } from "npm:hono/jwt";
import { JWT_COOKIE_EXPIRATION, JWT_SECRET } from "../../consts.tsx";
import { backendLogger } from "../../index.http.ts";
import { getUserByEmail, updateUser } from "../../db/users.ts";
import { z } from "npm:zod";
import { zValidator } from "npm:@hono/zod-validator";
import { HTTPException } from "npm:hono/http-exception";
import { verifyJwt } from "./utils.ts";
import { Hono } from "npm:hono";

export const loginRoute = new Hono()
  .get(
    "/login",
    zValidator(
      "json",
      z.object({
        token: z.string(),
        redirectUrl: z.string().optional().default("/"),
      }),
      async (val, c) => {
        const { token, redirectUrl } = val.data;

        const { email } = await verifyJwt(token, JWT_SECRET);

        const jwt = await sign({ email }, JWT_SECRET);

        setCookie(c, "auth_token", jwt, {
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          maxAge: JWT_COOKIE_EXPIRATION,
          path: "/",
        });

        backendLogger.info({ email }, "User logged in with magic link");
        return c.redirect(redirectUrl);
      },
    ),
  )
  .get(
    "/me",
    zValidator(
      "json",
      z.object({
        jwtPayload: z.object({
          email: z.string().email(),
        }),
      }),
      async (val, c) => {
        const { jwtPayload } = val.data;

        const user = await getUserByEmail(jwtPayload.email);

        if (!user) {
          return c.json({
            success: false,
            message: "User not found",
          }, 404);
        }

        return c.json({ success: true, user });
      },
    ),
  )
  .put(
    "/me",
    zValidator(
      "json",
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string(),
      }),
      async (val, _c) => {
        const { firstName, lastName, email } = val.data;

        try {
          const user = await getUserByEmail(email);

          if (!user) throw new HTTPException(404, { cause: "User not found" });

          const updatedUser = await updateUser(user.id, {
            firstName,
            lastName,
          });

          return Response.json({
            success: true,
            user: updatedUser,
          });
        } catch (error) {
          backendLogger.error({ error }, "Error updating user profile");
          return Response.json({
            success: false,
            message: "Failed to update user profile",
          }, { status: 500 });
        }
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

    backendLogger.info("User logged out");
    return c.json({ success: true, message: "Logged out successfully" }, 200);
  });
