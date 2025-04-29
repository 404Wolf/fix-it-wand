import { Hono } from "https://esm.sh/hono@4.7.7";
import OpenAI from "https://esm.sh/openai@4.96.0";
import { z } from "https://esm.sh/zod@3.24.3";
import { zValidator } from "https://esm.sh/@hono/zod-validator@0.4.3?deps=hono@4.7.7,zod@3.24.3";

const openai = new OpenAI();

/**
 * Transcribe audio from base64 string using OpenAI Whisper API
 *
 * @param audioB64 Base64 encoded audio data or URL
 * @returns Transcribed text
 */
export async function transcribeAudio(audioB64: string): Promise<string> {
  const audioResponse = await fetch(audioB64);
  const audioBlob = await audioResponse.blob();

  const audioFile = new File([audioBlob], "audio.mp3", { type: "audio/mp3" });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "text",
  });

  return transcription;
}

export const transcribeRoute = new Hono()
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        audioB64: z.string().url(),
      }),
    ),
    async (c) => {
      const body = await c.req.valid("json");
      const transcription = await transcribeAudio(body.audioB64);

      return c.json({ transcription });
    },
  );
