import { Hono } from "https://esm.sh/hono@4.7.7&target=deno";
import { HTTPException } from "https://esm.sh/hono@4.7.7/http-exception?deps=hono@4.7.7&target=deno";
import { z } from "https://esm.sh/zod@3.24.3";
import { zValidator } from "https://esm.sh/@hono/zod-validator@0.4.3?deps=hono@4.7.7,zod@3.24.3&target=deno";
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

      if (!nearestLocation) {
        throw new HTTPException(404, { message: "Location not found" });
      }

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
          throw new HTTPException(404, { message: "Location not found" });
        }
        return c.json(location);
      },
    ),
  );
