import { Hono } from "https://esm.sh/hono@4.7.7";
import { zValidator } from "https://esm.sh/@hono/zod-validator@0.4.3?deps=hono@4.7.7,zod@3.24.3";
import { HTTPException } from "https://esm.sh/hono@4.7.7/http-exception?deps=hono@4.7.7";
import { z } from "https://esm.sh/zod@3.24.3";
import { getUserByEmail, updateUser } from "../../db/users.ts";
import { protectedRouteMiddleware } from "./middlewares.ts";
import env from "../../env.ts";

export const profileRoute = new Hono()
  .use("*", protectedRouteMiddleware({ secret: env.JWT_SECRET }))
  .get(
    "/",
    async (c) => {
      const jwtPayload = c.get("jwtPayload");
      const user = await getUserByEmail(jwtPayload.email);

      if (!user) return c.json({ message: "User not found" }, 404);
      return c.json({ user });
    },
  )
  .put(
    "/",
    zValidator(
      "json",
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string(),
      }),
    ),
    async (c) => {
      const { firstName, lastName, email } = c.req.valid("json");

      const user = await getUserByEmail(email);
      if (!user) throw new HTTPException(404, { cause: "User not found" });

      const updatedUser = await updateUser(user.id, {
        firstName,
        lastName,
      });

      return c.json({ user: updatedUser });
    },
  );
