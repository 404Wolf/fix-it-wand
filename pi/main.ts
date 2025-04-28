import "https://esm.sh/jsr/@std/dotenv@0.225.3/load";
import { recordAndGenerateWorkorder } from "./workorders.ts";
import { getLocation, getNearestLocation } from "./geolocate.ts";
import { delay } from "https://esm.sh/jsr/@std/async@1.0.12";

async function main() {
  console.log("Getting location...");
  const geoLocation = await getLocation();

  if (geoLocation) {
    console.log(
      `Location: ${geoLocation.location.lat}, ${geoLocation.location.lng}`,
    );

    // Get the nearest location from our API
    const nearestLocation = await getNearestLocation(
      geoLocation.location.lat,
      geoLocation.location.lng,
    );

    if (nearestLocation) {
      console.log(`Nearest location: ${nearestLocation.LocationName}`);
    }
  }

  console.log("Starting recording...");
  const generateWorkorder = recordAndGenerateWorkorder(
    "plughw:1,0", // Audio device
    "Test User", // From name
  );

  // Record for 5 seconds
  await delay(5000);

  console.log("Generating workorder...");
  const result = await generateWorkorder();

  if (result.success) {
    console.log("Workorder generated successfully!");
    console.log("Email subject:", result.email.subject);
  } else {
    console.error("Failed to generate workorder:", result.error);
  }
}

main();
