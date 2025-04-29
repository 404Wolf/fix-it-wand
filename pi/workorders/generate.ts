import { client } from "../hono.ts";

/**
 * Function that generates a workorder from an audio base64 string
 *
 * @param params Options
 * @param params.audioBase64 Base64-encoded audio data (including data URI prefix)
 * @param params.fromName Name to use in the workorder
 * @returns The generated workorder
 */
export async function generateWorkorder(
  params: { audioBase64: string; fromName: string },
) {
  const { audioBase64, fromName } = params;

  const response = await client.workorders.generate
    .$post({
      json: {
        audioB64: audioBase64,
        fromName,
      },
    });
  return await response.json();
}
