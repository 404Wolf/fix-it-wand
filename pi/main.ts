import "https://esm.sh/jsr/@std/dotenv@0.225.3/load";
import { Recorder } from "./utils/Recorder.ts";
import { Command } from "https://esm.sh/jsr/@cliffy/command@1.0.0-rc.7";
import { readConfig, updateConfig } from "./config.ts";
import { BUTTON_GPIO_PIN } from "./consts.ts";
import { waitUntilPinStateChange } from "./utils/gpio.ts";
import { associateWand } from "./auth/associate.ts";
import { transcribeAudio } from "./utils/misc.ts";
import pino from "https://esm.sh/pino@8.18.0";
import { generateWorkOrder } from "./utils/workorders.ts";

const logger = pino({ level: 'debug' });

await new Command()
  .name("fixit-wand")
  .description("FixItWand CLI")
  .command("daemon", "Run the Fix It Wand daemon")
  .action(async () => {
    const config = readConfig();
    const fromName = config.wandId || "FixIt Wand";

    while (true) {
      await waitUntilPinStateChange(BUTTON_GPIO_PIN, true);
      logger.info("Button pressed, starting recording");

      const recorder = new Recorder({ device: "plughw:CARD=Device,DEV=0" });
      recorder.start();

      await waitUntilPinStateChange(BUTTON_GPIO_PIN, false);
      logger.info("Button released, finishing recording");

      const audioBase64 = await recorder.finish();

      try {
        // Transcribe the audio
        const transcript = await transcribeAudio(audioBase64);
        logger.debug("Audio transcribed: ", transcript);

        // Make sure we got a transcription
        if (!transcript) {
          logger.error("No transcription received");
          continue;
        }

        // Check if this is an association request
        if (transcript.toLocaleLowerCase().includes("associate")) {
          logger.info("Associate keyword detected, attempting to associate");

          const associateResult = await associateWand({ transcript });

          if (associateResult === true) {
            logger.info("Wand associated successfully!");
          } else if (isAssociationError(associateResult)) {
            logger.error(`Association failed: ${associateResult.error}`);
          } else {
            logger.error("Unexpected result from associateWand");
          }
        } else {
          // No association keyword, generate work order
          logger.info("Generating work order from audio");
          await generateWorkOrder(audioBase64, fromName);
        }
      } catch (error) {
        logger.error({ error }, "Error processing audio");
      }
    }
  })
  .reset()
  .command("set-wand-id <wandId:string>", "Set the wand ID")
  .action((_, wandId) => {
    updateConfig("wandId", wandId);
    logger.info(`Wand ID set to "${wandId}"`);
  })
  .parse(Deno.args);

// Helper function to check if the result is an association error
function isAssociationError(result: unknown): result is { error: string } {
  return typeof result === "object" && result !== null && "error" in result;
}
