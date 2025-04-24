import { Hono } from "npm:hono";
import { loginRoute } from "./login.ts";
import { magicAuthRoute } from "./magicAuth.ts";

export const authRoute = new Hono()
  .route("/", loginRoute)
  .route("/", magicAuthRoute);

export { jwtOrMasterAuth } from "./middlewares.ts"