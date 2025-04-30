import { client } from "../hono.ts";

/**
 * Transcribes base64 encoded audio to text.
 *
 * @param audioB64 - The base64 encoded audio data.
 * @returns A promise that resolves to the transcribed text.
 */
export async function transcribeAudio(audioB64: string): Promise<string> {
  const result = await client.transcribe.$post({ json: { audioB64 } });
  if (!result.ok) {
    throw new Error(`Failed to transcribe audio: ${result.status}`);
  }
  const { transcription } = await result.json();
  return transcription;
}

/**
 * Executes an operation in a temporary directory and ensures cleanup.
 *
 * @param op - Function that takes a temporary directory path and returns a Promise
 * @returns Promise that resolves to the result of the operation
 */
export async function doWithTempDir<T>(
  op: (tmpDir: string) => Promise<T>,
): Promise<T> {
  const tempDir = await Deno.makeTempDir();

  try {
    return await op(tempDir);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
}
