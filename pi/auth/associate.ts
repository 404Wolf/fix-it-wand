import { client } from "../hono.ts";
import { transcribeAudio } from "../utils/misc.ts";
import { getWandId } from "./meta.ts";

type AssociationError =
  | "no_associate_keyword"
  | "wrong_length"
  | "invalid_code";

/**
 * Associate the wand with a user.
 *
 * Makes an API request with an association code, and, if the association
 * code is valid, associates the wand.
 */
export async function associateWand({ base64Audio }: { base64Audio: string }) {
  const transcription = await transcribeAudio(base64Audio);

  // Make sure that they use the word "associate" in the audio
  if (!transcription.includes("associate")) {
    return { error: "no_associate_keyword" };
  }

  // Now grab the association code. This is the first letter of all of the words
  // in the recording, as a all caps string
  const verificationCode = transcription.split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  const resp = await client.wands.associate.$post({
    json: {
      verificationCode: verificationCode,
      wandId: await getWandId(),
    },
  });

  return resp.ok;
}
