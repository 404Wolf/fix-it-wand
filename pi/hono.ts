import { hc } from "https://esm.sh/hono@4.7.7/client?deps=hono@4.7.7";
import { AppType } from "../backend/routes/app.ts";
import { API_URL } from "../shared/consts.ts";
import { readConfig } from "./config.ts";
import logger from "./pino.ts";

export function getClient() {
  const config = readConfig();
  const wandId = config.wandId;

  logger.info({ message: "Creating Hono client", wandId });

  return hc<AppType>(API_URL + "/api", {
    headers: {
      ...(wandId ? { "Wand-Id": wandId } : {}),
    },
  });
}

export function refreshClient() {
  logger.info({ message: "Refreshing Hono client" });
  return getClient();
}

export const client = getClient();
