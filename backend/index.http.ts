// deno-lint-ignore-file require-await
// deno-fmt-ignore-file
import { cors } from "https://esm.sh/hono@4.7.7/cors?deps=hono@4.7.7";
import { serveFile } from "https://esm.town/v/std/utils@85-main/index.ts";
import { Hono } from "https://esm.sh/hono@4.7.7";
import { app as apiApp } from "./routes/app.ts";

const app = new Hono()
  .use("*", cors({ origin: "*" }))
  .get("/", async () => { return serveFile("/frontend/index.html", import.meta.url); })
  .route("/api", apiApp)
  .get("/frontend/*", async (c) => serveFile(c.req.path, import.meta.url))
  .get("/shared/*", async (c) => serveFile(c.req.path, import.meta.url))
  .onError((err, _c) => {
    throw err;
  });

export default app.fetch;
