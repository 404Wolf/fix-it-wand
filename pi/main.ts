import "https://esm.sh/jsr/@std/dotenv@0.225.3/load";
import { delay } from "https://esm.sh/jsr/@std/async@1.0.12";
import { Recorder } from "./utils/Recorder.ts";
import { generateWorkorder } from "./workorders/generate.ts";
import { Command } from "https://esm.sh/jsr/@cliffy/command@1.0.0-rc.7";
import { readConfig, updateConfig } from "./config.ts";

// Record audio and generate a workorder
async function recordAndGenerate() {
  console.log("Recording audio...");

  // Create recorder with specific device
  const recorder = new Recorder({
    device: "plughw:2,0",
  });

  // Start recording
  recorder.start();

  // Record for 5 seconds
  console.log("Speak now... (recording for 5 seconds)");
  await delay(5000);

  // Stop recording and get the audio as base64
  console.log("Processing audio...");
  const audioBase64 = await recorder.finish();

  // Get config for fromName
  const config = readConfig();
  const fromName = config.wandId || "FixIt Wand";

  // Generate workorder using the recorded audio
  console.log("Generating workorder...");
  const result = await generateWorkorder({
    audioBase64,
    fromName,
  });

  console.log("Workorder generated successfully!");
  console.log(result);
}

// Create commands using Cliffy Command properly
await new Command()
  .name("fixit-wand")
  .description("FixIt Wand CLI utility")
  .version("1.0.0")
  .command("generate-workorder", "Record audio and generate a workorder")
  .action(recordAndGenerate)
  .reset()
  .command("set-wand-id <wandId:string>", "Set the wand ID")
  .action((_, wandId) => {
    updateConfig("wandId", wandId);
    console.log(`Wand ID set to "${wandId}"`);
  })
  .parse(Deno.args);
