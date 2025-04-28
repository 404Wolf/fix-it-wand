import { verify as honoVerify } from "https://esm.sh/hono@4.7.7/jwt?deps=hono&target=deno";

/**
 * Standard JWT payload interface that includes required email field
 */
export interface JwtPayload {
  email: string;
  sub?: string;
  role?: string;
  isMasterToken?: boolean;
  [key: string]: any;
}

/**
 * Verify a JWT token and return a properly typed payload
 * @param token The JWT token to verify
 * @param secret The secret used to verify the token
 * @returns The typed JWT payload
 */
export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload> {
  const payload = await honoVerify(token, secret);

  // Ensure the payload has the required structure
  if (!payload || typeof payload !== "object" || !("email" in payload)) {
    throw new Error("Invalid token payload");
  }

  return payload as JwtPayload;
}
