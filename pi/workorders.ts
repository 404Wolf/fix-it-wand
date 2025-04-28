import "jsr:@std/dotenv/load";
import { Recorder } from "./Recorder.ts";
import { Buffer } from "node:buffer";
import { client } from "./hono.ts";

/**
 * Function that starts recording and returns a callback to stop recording and generate workorder
 *
 * @param device Audio device to use (like plughw:3,0)
 * @param fromName Name to use in the workorder (default: FixIt Wand)
 * @returns A callback function that stops recording and returns the generated workorder
 */
export function recordAndGenerateWorkorder(
  device: string,
  fromName: string,
) {
  const tempFilePath = Deno.makeTempFileSync({ suffix: ".wav" });
  const recorder = new Recorder(tempFilePath, { device });
  recorder.start();

  return async () => {
    try {
      await recorder.finish();

      const audio = await Deno.readFile(tempFilePath);
      const audioBase64 = `data:audio/wav;base64,${
        Buffer.from(audio).toString("base64")
      }`;

      const response = await client.workorders.generate.$post({
        json: {
          audioB64: audioBase64,
          fromName,
        },
      });
      return await response.json();
    } finally {
      await Deno.remove(tempFilePath);
    }
  };
}
