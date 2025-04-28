import "jsr:@std/dotenv/load";
import { Recorder } from "./Recorder.ts";
import { Buffer } from "node:buffer";
import { client, getAuthHeader } from "../client.ts";

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
  const recorder = new Recorder("./recording.wav", { device });
  recorder.start();

  // Return a callback that stops recording and generates the workorder
  return async () => {
    await recorder.finish();

    const audio = await Deno.readFile("./recording.wav");
    const audioBase64 = `data:audio/wav;base64,${
      Buffer.from(audio).toString("base64")
    }`;

    // Use the Hono client to make the API call
    const response = await client.workorders.generate.$post({
      json: {
        audioB64: audioBase64,
        imageB64: "", // This might need to be updated based on your requirements
        fromName,
      },
      headers: getAuthHeader(),
    });

    return await response.json();
  };
}
