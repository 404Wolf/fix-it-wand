import { createMiddleware } from "npm:hono/factory";
import { HTTPException } from "npm:hono/http-exception";
import { jwt, JwtVariables } from "npm:hono/jwt";

/**
 * Middleware that attempts JWT authentication and falls back to master bearer token.
 *
 * Sets jwtPayload in the context if authentication is successful.
 */
export const jwtOrMasterAuth = (options: {
  secret: string;
  cookie?: string;
}) => {
  const jwtMiddleware = jwt(options);

  return createMiddleware<{
    Variables: JwtVariables;
  }>(async (c, next) => {
    try {
      // Try JWT authentication first
      await jwtMiddleware(c, next);
    } catch (_e) {
      // If JWT fails, check for master bearer token
      const authHeader = c.req.header("Authorization");
      const masterToken = Deno.env.get("MASTER_BEARER");

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

      // Set a simple payload for master token
      c.set("jwtPayload", {
        sub: "master",
        role: "admin",
        isMasterToken: true,
      });

      await next();
    }
  });
};
