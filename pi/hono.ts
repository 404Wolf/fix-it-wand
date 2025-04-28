import { hc } from "https://esm.sh/hono@4.7.7/client?deps=hono@4.7.7";
import { AppType } from "../backend/routes/app.ts";
import { API_URL } from "../shared/consts.ts";
import { getWandId } from "./auth.ts";

export const client = hc<AppType>(API_URL + "/api", {
  headers: {
    "Wand-Id": await getWandId(),
  },
});
