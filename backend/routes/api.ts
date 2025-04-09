import { Hono } from "npm:hono";
import { authRoute } from "./auth.tsx";
import { workorderRoute } from "./workorder.ts";
import { backendLogger } from "../index.http.ts";
import { locationsRoute } from "./locations.ts";

// Create API router
export const apiRoute = new Hono();

// Root endpoint with basic status
apiRoute.get("/", (c) => {
  backendLogger.info("API status check");
  return c.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// Mount routes
apiRoute.route("/workorders", workorderRoute);
apiRoute.route("/auth", authRoute);
apiRoute.route("/locations", locationsRoute);
