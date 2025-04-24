import { Hono } from "npm:hono";
import { z } from "npm:zod";
import { zValidator } from "npm:@hono/zod-validator";
import {
  getLocationBySiteId,
  getNearest,
  getSites,
  search,
} from "../../workorders/locations/mod.ts";

export const locationsRoute = new Hono()
  .get("/sites", async (c) => {
    return c.json(await getSites());
  })
  .get(
    "/sites/:id",
    zValidator("param", z.object({ id: z.string().regex(/^\d+$/) })),
    async (c) => {
      const siteId = parseInt(c.req.param("id"));
      return c.json(await getLocationBySiteId(siteId));
    },
  )
  .get(
    "/nearest",
    zValidator(
      "query",
      z.object({
        lat: z.string().regex(/^-?\d+(\.\d+)?$/),
        lng: z.string().regex(/^-?\d+(\.\d+)?$/),
      }),
    ),
    async (c) => {
      const latitude = parseFloat(c.req.query("lat") || "");
      const longitude = parseFloat(c.req.query("lng") || "");

      const nearestLocation = await getNearest(latitude, longitude);

      if (!nearestLocation) return c.json({ error: "No locations found" }, 404);

      return c.json(nearestLocation);
    },
  )
  .get(
    "/search",
    zValidator("query", z.object({ q: z.string().min(1) })),
    zValidator(
      "query",
      z.object({ q: z.string() }),
      async (val, c) => {
        const location = await search(val.data.q);
        if (!location) {
          return c.json({ error: "No matching location found" }, 404);
        }
        return c.json(location);
      },
    ),
  );
