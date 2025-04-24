import { serveFile } from "https://esm.town/v/std/utils@65-main/index.ts";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { pino } from "npm:pino";
import { apiRoute } from "./routes/api.ts";
import { authRoute } from "./routes/auth.tsx";

export const backendLogger = pino();

const app = new Hono();

// Enable CORS
app.use("*", cors());

// Request logging middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  backendLogger.info({ method, path }, "Request received");

  try {
    await next();
  } catch (err) {
    backendLogger.error({ err, path: c.req.path }, "Error occurred");
  }

  const elapsed = Date.now() - start;
  backendLogger.info({ method, path, elapsed }, "Request completed");
});

// Mount API routes with higher precedence
app.route("/api", apiRoute);
app.route("/auth", authRoute);

// Serve all /frontend files
app.get("/frontend/**/*", (c) => serveFile(c.req.path, import.meta.url));

// Serve index.html at the root /
app.get("/", (_c) => {
  return serveFile("/frontend/index.html", import.meta.url);
});

// Catch-all route to handle client-side routing
app.get("*", (_c) => {
  return serveFile("/frontend/index.html", import.meta.url);
});

export default app.fetch;
