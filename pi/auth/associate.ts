import { client } from "../hono.ts";
import { readConfig } from "../config.ts";
import logger from "../pino.ts";

type AssociationError =
  | "wrong_length"
  | "invalid_code"
  | "association_failed";

/**
 * Associate the wand with a user.
 *
 * Makes an API request with an association code from the transcript, and,
 * if the association code is valid, associates the wand.
 */
export async function associateWand({ transcript }: { transcript: string }) {
  try {
    // Extract the association code - first letter of each word in uppercase
    const verificationCode = Array.from(
      transcript.toLowerCase().matchAll(/(\b\w+\b)/g),
    )
      .map((match) => match[1].charAt(0).toUpperCase())
      .slice(1)
      .join("")
      .toUpperCase();

    logger.debug({ verificationCode }, "Generated verification code");

    const config = readConfig();
    logger.debug({ wandId: config.wandId }, "Using wand ID from config");

    logger.debug(
      { transcript },
      "Attempting to associate wand with transcript",
    );
    const resp = await client.wands.associate.$post({
      json: {
        verificationCode: verificationCode,
        wandId: config.wandId!,
      },
    });

    if (resp.ok) {
      logger.info("Wand association successful");
      return true;
    } else {
      logger.warn({ status: resp.status }, "Wand association failed");
      return { error: "association_failed" as const };
    }
  } catch (error) {
    logger.error({ error }, "Error during wand association");
    return { error: "association_failed" as const };
  }
}
