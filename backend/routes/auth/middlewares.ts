import { createMiddleware } from "https://esm.sh/hono@4.7.7/factory?deps=hono@4.7.7";
import { HTTPException } from "https://esm.sh/hono@4.7.7/http-exception?deps=hono@4.7.7";
import {
  jwt,
  JwtVariables,
} from "https://esm.sh/hono@4.7.7/jwt?deps=hono@4.7.7";
import env from "../../env.ts";
import { JwtPayload } from "./utils.ts";
import { db } from "../../db/mod_http.ts";
import { usersTable, wandsTable } from "../../db/schemas_http.ts";
import { eq } from "https://esm.sh/drizzle-orm@0.41.0";

export interface AuthVariables extends JwtVariables {
  jwtPayload: JwtPayload;
}

/**
 * Middleware that attempts JWT authentication, master bearer token, or using a
 * Wand-Id header for a valid wand.
 *
 * Sets jwtPayload in the context if authentication is successful.
 */
export const protectedRouteMiddleware = (options: { secret: string }) => {
  const jwtMiddleware = jwt({
    ...options,
    cookie: { key: "auth_token" },
  });

  return createMiddleware<{
    Variables: AuthVariables;
  }>(async (c, next) => {
    try {
      // Try JWT authentication first
      await jwtMiddleware(c, next);
    } catch (e) {
      console.log("JWT authentication failed:", e);

      // If JWT fails, check for master bearer token
      const authHeader = c.req.header("Authorization");
      const masterToken = env.MASTER_BEARER;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        if (masterToken && token === masterToken) {
          c.set("jwtPayload", {
            sub: "master",
            role: "admin",
            isMasterToken: true,
            email: env.MASTER_EMAIL,
          });

          await next();
          return;
        }
      }

      // First check for Wand-Id header
      const wandId = c.req.header("Wand-Id");
      console.log("Wand-Id:", wandId);
      if (wandId) {
        // Query the wand to see if it's associated; if it is use the associated user email
        const wand = await db
          .select({
            id: wandsTable.id,
            owner: wandsTable.owner,
            ownerEmail: usersTable.email,
          })
          .from(wandsTable)
          .innerJoin(usersTable, eq(wandsTable.owner, usersTable.id))
          .where(eq(wandsTable.id, wandId))
          .execute();

        let email = "unset";
        if (wand.length > 0) {
          // Authenticate using the wand owner's email
          email = wand[0].ownerEmail || "unset";
        }
        c.set("jwtPayload", {
          sub: wandId,
          role: "user",
          isMasterToken: false,
          email: email,
        });

        await next();
        return;
      }

      // If all authentication methods fail, return appropriate error
      if (!masterToken) {
        throw new HTTPException(401, {
          message: "Master token not configured",
        });
      } else {
        throw new HTTPException(401, { message: "Authentication required" });
      }
    }
  });
};
