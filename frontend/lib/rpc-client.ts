import { hc } from "npm:hono/client";
import type { AppType } from "../../backend/routes/index.ts";

// Create the client with credentials option to include cookies
export const client = hc<AppType>(
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:8000",
  {
    init: {
      credentials: "include",
    },
  },
);

// For client-side usage (browser environment)
export function getClientUrl() {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:8000";
  return baseUrl;
}

// Also export type utilities for client usage
export type { InferRequestType, InferResponseType } from "npm:hono/client";
