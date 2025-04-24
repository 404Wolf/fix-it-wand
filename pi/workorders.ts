import "jsr:@std/dotenv/load";
import { Recorder } from "./Recorder.ts";
import { API_URL } from "./consts.ts";
import { Buffer } from "node:buffer";

/**
 * Function that starts recording and returns a callback to stop recording and generate workorder
 * @param device Audio device to use (like plughw:3,0)
 * @param fromName Name to use in the workorder (default: FixIt Wand)
 * @returns A callback function that stops recording and returns the generated workorder
 */
export function recordAndGenerateWorkorder(
  device: string,
  fromName: string,
) {
  const MASTER_BEARER = Deno.env.get("MASTER_BEARER");

  const recorder = new Recorder("./recording.wav", { device });
  recorder.start();

  // Return a callback that stops recording and generates the workorder
  return async () => {
    try {
      await recorder.finish();

      const audio = await Deno.readFile("./recording.wav");
      const audioBase64 = `data:audio/wav;base64,${
        Buffer.from(audio).toString("base64")
      }`;

      const response = await fetch(`${API_URL}/api/workorders/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${MASTER_BEARER}`,
        },
        body: JSON.stringify({
          audioB64: audioBase64,
          fromName,
        }),
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
}
