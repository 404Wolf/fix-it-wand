import "https://esm.sh/jsr/@std/dotenv@0.225.3/load";
import logger from "../pino.ts";

interface GeolocationResponse {
  location: {
    lat: number;
    lng: number;
  };
  accuracy: number;
}

export async function getLocation(): Promise<GeolocationResponse | null> {
  const networkInterfaces = Deno.networkInterfaces();
  const wifiAccessPoints = networkInterfaces
    .filter((iface) => iface.mac !== "00:00:00:00:00:00")
    .map((iface) => ({ macAddress: iface.mac }));

  const apiKey = Deno.env.get("GOOGLE_GEOLOCATION");
  const body = { wifiAccessPoints };

  try {
    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    logger.info({ message: "Geolocation API request successful" });
    return await response.json() as GeolocationResponse;
  } catch (error) {
    logger.error({ message: "Geolocation API request failed", error });
    return null;
  }
}
