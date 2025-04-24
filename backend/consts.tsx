/** @jsxImportSource https://esm.sh/react@19.0.0 */

// Use environment variables or fallback to default values for development
export const MAGIC_LINK_SECRET = Deno.env.get("MAGIC_LINK_SECRET")!;
export const JWT_SECRET = "your-secret-key"; // Make sure this is correctly set
export const VAL_TOWN_API_KEY = Deno.env.get("valtown")!;

import { EmailTemplate } from "./utils/EmailTemplate.tsx";

export { EmailTemplate };
export const JWT_COOKIE_EXPIRATION = 7 * 24 * 60 * 60; // 7 days in seconds
