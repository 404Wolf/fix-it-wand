import { client } from "../hono.ts";
import logger from "../pino.ts";

/**
 * Generates a work order and submits it.
 *
 * @param audioBase64 - The base64 encoded audio data.
 * @param fromName - The name of the person initiating the work order.
 * @throws Throws an error if the work order generation or submission fails.
 */
export async function generateWorkOrder(audioBase64: string, fromName: string) {
  try {
    const response = await client.workorders.generate.$post({
      json: {
        audioB64: audioBase64,
        fromName,
      },
    });

    const result = await response.json();
    logger.info("Work order generated, submitting...");

    const submitResponse = await client.workorders.$post({
      json: {
        email_body: result.email.body,
        email_subject: result.email.subject,
      },
    });

    if (submitResponse.ok) {
      logger.info("Work order submitted successfully");
    } else {
      logger.error(
        { status: submitResponse.status },
        "Failed to submit work order",
      );
    }
  } catch (error) {
    logger.error({ error }, "Failed to generate or submit work order");
  }
}
