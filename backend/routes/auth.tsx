/** @jsxImportSource https://esm.sh/react@19.0.0 */

import type { JwtVariables } from "npm:hono/jwt";
import { jwt, verify } from "npm:hono/jwt";
import { setCookie } from "npm:hono/cookie";
import { sign } from "npm:hono/jwt";
import { renderToString } from "npm:react-dom/server";
import { Hono } from "npm:hono";
import { sendEmail } from "../utils.ts";
import {
  EmailTemplate,
  JWT_COOKIE_EXPIRATION,
  JWT_SECRET,
} from "../consts.tsx";
import { backendLogger } from "../index.http.ts";
import { createUser, getUserByEmail, updateUser } from "../db/users.ts";
import { createMiddleware } from "npm:hono/factory";
import { HTTPException } from "npm:hono/http-exception";

export const authRoute = new Hono<{ Variables: JwtVariables }>();

/**
 * Middleware that attempts JWT authentication and falls back to master bearer token.
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

// Route to request magic link
authRoute.post("/request-magic-link", async (c) => {
  try {
    const body = await c.req.json();
    const { email, redirectUrl = "/" } = body;

    if (!email) {
      return c.json({
        success: false,
        message: "Email is required",
      }, 400);
    }

    let token: string;

    // Try getting the user if they exist, so we can log them in with a fresh
    // jwt
    const user = await getUserByEmail(email);
    if (user) {
      // If user exists, we can send them a magic link
      backendLogger.info({ email }, "User exists, sending magic link");

      // Generate token
      token = await sign({ email }, JWT_SECRET);
    } else {
      // Create user if not exists
      await createUser({ email });

      // Generate token
      token = await sign({ email }, JWT_SECRET);
    }

    // Magic link URL
    const magicLinkUrl = `${
      c.req.url.split("/auth")[0]
    }/auth/login?token=${token}&redirectUrl=${encodeURIComponent(redirectUrl)}`;

    // Email content
    const emailContent = renderToString(
      <EmailTemplate magicLink={magicLinkUrl} />,
    );

    // Send magic link email
    await sendEmail({
      to: email,
      subject: "Your Fix It Wand Magic Link",
      html: emailContent,
    }, true); // Send in background

    backendLogger.info({ email }, "Magic link sent");

    return c.json({
      success: true,
      message: "Magic link sent to your email",
    });
  } catch (error) {
    backendLogger.error({ error }, "Error sending magic link");
    return c.json({
      success: false,
      message: "Failed to send magic link",
    }, 500);
  }
});

// Login with token to get cookie
authRoute.get("/login", async (c) => {
  const { token, redirectUrl = "/" } = c.req.query();

  try {
    // Verify token
    const payload = await verify(token, JWT_SECRET);

    // Generate session token
    const sessionToken = await sign(
      {
        email: payload.email,
        exp: JWT_COOKIE_EXPIRATION,
      }, // 7 days,
      JWT_SECRET,
    );

    // Set auth cookie
    setCookie(c, "auth_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    backendLogger.info({ email: payload.email }, "User logged in");

    // Redirect to the specified URL
    return c.redirect(redirectUrl);
  } catch (error) {
    backendLogger.error({ error }, "Invalid login token");
    return c.json({
      success: false,
      message: "Invalid or expired token",
    }, 401);
  }
});

// Current user
authRoute.get(
  "/me",
  jwt({ secret: JWT_SECRET, cookie: "auth_token" }),
  async (c) => {
    const payload = c.get("jwtPayload");
    const email = payload.email;

    try {
      const user = await getUserByEmail(email);

      if (!user) {
        return c.json({
          success: false,
          message: "User not found",
        }, 404);
      }

      return c.json({
        success: true,
        user,
      });
    } catch (error) {
      backendLogger.error({ error }, "Error getting user");
      return c.json({
        success: false,
        message: "Failed to get user information",
      }, 500);
    }
  },
);

// Update user profile
authRoute.put(
  "/me",
  jwt({ secret: JWT_SECRET, cookie: "auth_token" }),
  async (c) => {
    const payload = c.get("jwtPayload");
    const email = payload.email;

    try {
      const body = await c.req.json();
      const { firstName, lastName } = body;

      const user = await getUserByEmail(email);

      if (!user) {
        return c.json({
          success: false,
          message: "User not found",
        }, 404);
      }

      // Update user with the new information
      const updatedUser = await updateUser(user.id, {
        firstName,
        lastName,
      });

      return c.json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      backendLogger.error({ error }, "Error updating user profile");
      return c.json({
        success: false,
        message: "Failed to update user profile",
      }, 500);
    }
  },
);

// Logout
authRoute.post("/logout", (c) => {
  // Clear the auth cookie by setting expired date
  setCookie(c, "auth_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    expires: new Date(0), // Thu Jan 01 1970
    path: "/",
  });

  backendLogger.info("User logged out");
  return c.json({ success: true, message: "Logged out successfully" }, 200);
});
