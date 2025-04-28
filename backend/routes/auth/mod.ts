import { Hono } from "https://esm.sh/hono@4.7.7";
import { loginRoute } from "./login.ts";
import { magicAuthRoute } from "./magicAuth.ts";
import { profileRoute } from "./me.ts";

export const authRoute = new Hono()
  .route("/magicSignIn", magicAuthRoute)
  .route("/me", profileRoute)
  .route("/", loginRoute);

export { protectedRouteMiddleware as jwtOrMasterAuth } from "./middlewares.ts";
