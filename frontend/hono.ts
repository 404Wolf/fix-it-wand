import type { ApiRoute } from "../backend/routes/api.ts";
import { hc } from "npm:hono/client";

export const client = hc<ApiRoute>("http://localhost:8787/");
