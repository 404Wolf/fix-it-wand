import "https://esm.sh/jsr/@std/dotenv@0.225.3/load";
import { client } from "./hono.ts";

interface GeolocationResponse {
  location: {
    lat: number;
    lng: number;
  };
  accuracy: number;
}

/**
 * Gets the current location using Google's Geolocation API
 */
export async function getLocation(): Promise<GeolocationResponse | null> {
  const networkInterfaces = Deno.networkInterfaces();
  const wifiAccessPoints = networkInterfaces
    .filter((iface) => iface.mac !== "00:00:00:00:00:00") // Filter out invalid MACs
    .map((iface) => ({ macAddress: iface.mac }));

  const apiKey = Deno.env.get("GOOGLE_GEOLOCATION");
  if (!apiKey) {
    throw new Error("GOOGLE_GEOLOCATION environment variable is not set");
  }

  const body = { wifiAccessPoints };

  const response = await fetch(
    `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  return await response.json() as GeolocationResponse;
}

/**
 * Gets the nearest location from our API using coordinates
 */
export async function getNearestLocation(lat: number, lng: number) {
  try {
    const response = await client.locations.nearest.$get({
      query: { lat: lat.toString(), lng: lng.toString() },
    });
    const data = await response.json();
    if (data === null) {
      throw new Error("No nearest location found");
    }
    return data;
  } catch (error) {
    console.error("Error getting nearest location:", error);
    return null;
  }
}
