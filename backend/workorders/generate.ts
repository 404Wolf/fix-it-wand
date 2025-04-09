import OpenAI from "npm:openai";
import { search } from "./locations/mod.ts";

const openai = new OpenAI();

/**
 * Generate a work order given an audio recording describing the issue and a
 * photo of the issue.
 *
 * @param {Object} params - The parameters for generating the work order email
 * @param {string} params.imageB64 - Base64 of the image of the issue
 * @param {string} params.audioB64 - Base64 of the audio recording describing the issue
 * @param {string} params.fromName - Name of the sender
 * @returns {Promise<{body: string, subject: string}>} The formatted work order email with subject
 */
export async function generateWorkorderEmail(
  {
    imageB64,
    audioB64,
    fromName,
  }: {
    imageB64: string;
    audioB64: string;
    fromName: string;
  },
): Promise<{ body: string; subject: string }> {
  // Transcribe the audio from the URL
  const audioResponse = await fetch(audioB64);
  const audioBlob = await audioResponse.blob();

  const audioFile = new File([audioBlob], "a.mp3", { type: "audio/mp3" });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "text",
  });

  // Detect possible location references in the transcription
  const locationDetectionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          `You are an assistant that extracts location references from text.
Extract any building name, room number, or location mentioned in the text.
Return ONLY the location reference, nothing else. If no location is mentioned,
return 'No location mentioned'.`,
      },
      {
        role: "user",
        content: transcription,
      },
    ],
    max_tokens: 50,
  });

  const locationReference =
    locationDetectionResponse.choices[0].message.content?.trim() ||
    "No location mentioned";

  // Only search for location if a reference was detected
  let locationInfo = "";
  if (locationReference !== "No location mentioned") {
    const location = await search(locationReference);
    if (location) {
      locationInfo = `${location.LocationName} (${location.Addr1}${
        location.Addr2 ? ", " + location.Addr2 : ""
      }, ${location.City}, ${location.StateProvince})`;
    }
  }

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          `You are a student who wants to improve campus by submitting work
 orders. Generate a work order email based on the provided issue description and
 image. Include relevant details and if useful recommended actions. Be
 relatively brief. Be very down to the point. Don't make assumptions. Say what
 must be done. Use short paragraph form. DO NOT SIGN (best, <>) THE EMAIL, DO
 NOT INCLUDE A SUBJECT, OR ANY OTHER PLACEHOLDERS. Just give the body and the
 intro You want to get stuff done!. Mention the attached image. Be a bit
 forceful. Don't say it is "urgent" unless you think it is urgent. Do not sound
 overly formal or wordy.${
            locationInfo
              ? ` Reference the specific location information provided, but you
don't need to include the full address, just the building and zone etc general
info.`
              : ""
          }`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Please generate a work order email based on this issue description: ${transcription}${
                locationInfo ? "\n\nLocation information: " + locationInfo : ""
              }`,
          },
          {
            type: "image_url",
            image_url: {
              url: imageB64,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const workOrderContent = chatResponse.choices[0].message.content;

  const fullBody = `
CWRU Maintenance,

${workOrderContent}

Best regards,
${fromName}
`;

  const subjectResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are helping write subject lines for maintenance emails.
 Summarize the issue into a short, useful subject line. Be concise and accurate.
 Do not include 'Work Order' or greetings. This should look like "Maintenance
 Request - Clogged Toilet - Staley House 620A"${
          locationInfo ? " Include the location name in the subject." : ""
        }`,
      },
      {
        role: "user",
        content: fullBody,
      },
    ],
    max_tokens: 50,
  });

  const subject = subjectResponse.choices[0].message.content?.trim() ??
    "Maintenance Issue";

  return {
    body: fullBody.trim(),
    subject,
  };
}
