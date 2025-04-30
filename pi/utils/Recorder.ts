import mic from "npm:mic";
import { createWriteStream, WriteStream } from "node:fs";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import logger from "../pino.ts";

type MicOptions = {
  rate?: string;
  channels?: string;
  debug?: boolean;
  exitOnSilence?: number;
  fileType?: string;
  device?: string;
};

export class Recorder {
  private filePath: string;
  private micInstance: mic.MicInstance;
  private outputFile: WriteStream;
  private micStream: NodeJS.ReadableStream;

  constructor(options: MicOptions = {}) {
    const tempDir = Deno.makeTempDirSync();
    this.filePath = join(tempDir, `recording_${Date.now()}.wav`);

    const micConfig: mic.Options = {
      rate: options.rate ?? "16000",
      channels: options.channels ?? "2",
      debug: options.debug ?? false,
      exitOnSilence: options.exitOnSilence ?? 6,
      fileType: options.fileType ?? "wav",
      device: options.device ?? "plughw:1,0",
    };

    this.outputFile = createWriteStream(this.filePath);
    this.micInstance = mic(micConfig);
    this.micStream = this.micInstance.getAudioStream();
    this.micStream.pipe(this.outputFile);

    logger.debug({
      message: "Recorder initialized",
      micConfig,
      filePath: this.filePath,
    });
  }

  /** Starts recording. */
  start() {
    this.micInstance.start();
    logger.info({ message: "Recording started" });
  }

  /**
   * Stops recording, finalizes the output file, and returns the audio as base64.
   * @returns Promise resolving to the base64 encoded audio data
   */
  finish(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.micInstance.stop();
      logger.info({ message: "Recording stopped" });

      setTimeout(async () => {
        try {
          this.outputFile.end();

          const audioBuffer = await readFile(this.filePath);

          const base64Audio = `data:audio/wav;base64,${
            Buffer.from(audioBuffer).toString("base64")
          }`;

          try {
            await Deno.remove(this.filePath);
            logger.debug({
              message: "Temporary audio file deleted",
              filePath: this.filePath,
            });
          } catch (cleanupError) {
            logger.warn(
              {
                message: "Failed to delete temporary audio file",
                filePath: this.filePath,
                cleanupError,
              },
            );
          }

          logger.info({
            message: "Recording finished",
            filePath: this.filePath,
          });
          resolve(base64Audio);
        } catch (error) {
          logger.error({ message: "Error finishing recording", error });
          reject(error);
        }
      }, 500);
    });
  }
}
