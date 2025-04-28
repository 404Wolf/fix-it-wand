import "https://esm.sh/jsr/@std/dotenv@0.225.3/load";
import { recordAndGenerateWorkorder } from "./workorders.ts";
import { delay } from "https://esm.sh/jsr/@std/async@1.0.12";

async function main() {
  console.log("Starting recording...");
  const generateWorkorder = recordAndGenerateWorkorder(
    "plughw:2,0",
    "Test User",
  );

  await delay(5000);

  console.log("Generating workorder...");
  const result = await generateWorkorder();
  console.log("Workorder generated successfully!");
  console.log("Email subject:", result.email.subject);
  console.log("Email body:", result.email.body);
}

main();
