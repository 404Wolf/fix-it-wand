import { Hono } from "npm:hono";
import { workorderRoute } from "./api/workorder.ts";
import { backendLogger } from "../index.http.ts";
import { authRoute } from "./auth/mod.ts";
import { locationsRoute } from "./api/locations.ts";

export const apiRoute = new Hono()
  .get("/", (c) => {
    backendLogger.info("Status check");
    return c.json({
      status: "ok",
      time: new Date().toISOString(),
    });
  })
  .route("/workorders", workorderRoute)
  .route("/auth", authRoute)
  .route("/locations", locationsRoute);

export type ApiRoute = typeof apiRoute;
