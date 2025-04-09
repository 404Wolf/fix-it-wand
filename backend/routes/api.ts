import { Hono } from "npm:hono";
import { authRoute } from "./auth.tsx";
import { workorderRoute } from "./workorder.ts";
import { userWorkordersRoute } from "./user-workorders.ts";
import { logger } from "../index.http.ts";
import { locationsRoute } from "./locations.ts";

// Create API router
export const apiRoute = new Hono();

// Root endpoint with basic status
apiRoute.get("/", (c) => {
  logger.info("API status check");
  return c.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});

// Mount routes
apiRoute.route("/workorder", workorderRoute);
apiRoute.route("/user-workorders", userWorkordersRoute);
apiRoute.route("/auth", authRoute);
apiRoute.route("/locations", locationsRoute);
