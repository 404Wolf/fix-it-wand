import { hc } from "https://esm.sh/hono@4.7.7/client";
import { ApiRoute } from "../backend/routes/app.ts";
import { API_URL } from "../shared/consts.ts";
import { QueryClient } from "https://esm.sh/@tanstack/react-query@5.74.7?deps=react@19.0.0";

export const client = hc<ApiRoute>(
  typeof window !== "undefined"
    ? window.location.origin + "/api"
    : API_URL + "/api",
  { init: { credentials: "include" } },
);
export const queryClient = new QueryClient();
