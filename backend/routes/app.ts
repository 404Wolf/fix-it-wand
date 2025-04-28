import { Hono } from "https://esm.sh/hono@4.7.7?target=deno";
import { workorderRoute } from "./api/workorders.ts";
import { authRoute } from "./auth/mod.ts";
import { locationsRoute } from "./api/locations.ts";

export const apiRoute = new Hono()
  .get("/", (c) => {
    return c.json({
      status: "ok",
      time: new Date().toISOString(),
    });
  })
  .route("/workorders", workorderRoute)
  .route("/auth", authRoute)
  .route("/locations", locationsRoute);

export type ApiRoute = typeof apiRoute;
