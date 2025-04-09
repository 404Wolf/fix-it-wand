import { Hono } from "npm:hono";
import {
  getLocationBySiteId,
  getNearest,
  getSites,
  search,
} from "../workorders/locations/mod.ts";

export const locationsRoute = new Hono();

locationsRoute.get("/sites", async (c) => {
  const sites = await getSites();
  return c.json(sites);
});

locationsRoute.get("/sites/:id", async (c) => {
  const siteId = parseInt(c.req.param("id"));

  const locations = await getLocationBySiteId(siteId);
  return c.json(locations);
});

locationsRoute.get("/nearest", async (c) => {
  const latitude = parseFloat(c.req.query("lat") || "");
  const longitude = parseFloat(c.req.query("lng") || "");

  const nearestLocation = await getNearest(latitude, longitude);

  if (!nearestLocation) {
    return c.json({ error: "No locations found" }, 404);
  }

  return c.json(nearestLocation);
});

locationsRoute.get("/search", async (c) => {
  const query = c.req.query("q");

  if (!query) {
    return c.json({ error: "Missing search query parameter" }, 400);
  }

  console.log(query)
  const location = await search(query);
  console.log(location)

  if (!location) {
    return c.json({ error: "No matching location found" }, 404);
  }

  return c.json(location);
});
