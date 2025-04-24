import mic from "npm:mic";
import { createWriteStream, WriteStream } from "node:fs";

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

  constructor(filePath: string, options: MicOptions = {}) {
    this.filePath = filePath;

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
  }

  /** Starts recording. */
  start() {
    this.micInstance.start();
  }

  /** Stops recording and finalizes the output file. */
  finish(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Use addEventListener if available, otherwise use a timeout approach
      this.micInstance.stop();

      // Give some time for the file to finish writing
      setTimeout(() => {
        this.outputFile.end();
        resolve();
      }, 500);
    });
  }
}
