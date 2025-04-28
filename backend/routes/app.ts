import { Hono } from "https://esm.sh/hono@4.7.7";
import { workorderRoute } from "./api/workorders.ts";
import { authRoute } from "./auth/mod.ts";
import { locationsRoute } from "./api/locations.ts";
import { wandsRoute } from "./api/wands.ts";
import { transcribeRoute } from "./api/transcribe.ts";

export const app = new Hono()
  .get("/", (c) => {
    return c.json({
      status: "ok",
      time: new Date().toISOString(),
    });
  })
  .route("/workorders", workorderRoute)
  .route("/wands", wandsRoute)
  .route("/auth", authRoute)
  .route("/locations", locationsRoute)
  .route("/transcribe", transcribeRoute);

export type AppType = typeof app;
