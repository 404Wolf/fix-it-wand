import { createMiddleware } from "https://esm.sh/hono@4.7.7/factory?deps=hono@4.7.7";
import { HTTPException } from "https://esm.sh/hono@4.7.7/http-exception?deps=hono@4.7.7";
import {
  jwt,
  JwtVariables,
} from "https://esm.sh/hono@4.7.7/jwt?deps=hono@4.7.7";
import env from "../../env.ts";
import { JwtPayload } from "./utils.ts";

export interface AuthVariables extends JwtVariables {
  jwtPayload: JwtPayload;
}

/**
 * Middleware that attempts JWT authentication and falls back to master bearer token.
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

      if (!masterToken) {
        throw new HTTPException(401, {
          message: "Master token not configured",
        });
      }

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new HTTPException(401, { message: "Bearer token required" });
      }

      const token = authHeader.split(" ")[1];

      if (token !== masterToken) {
        throw new HTTPException(401, { message: "Invalid token" });
      }

      c.set("jwtPayload", {
        sub: "master",
        role: "admin",
        isMasterToken: true,
        email: env.MASTER_EMAIL,
      });

      await next();
    }
  });
};
