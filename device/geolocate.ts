import "@std/dotenv/load";

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
    .filter((iface) => iface.mac !== "00:00:00:00:00:00") // Filter out invalid MACs
    .map((iface) => ({ macAddress: iface.mac }));

  const apiKey = Deno.env.get("GOOGLE_GEOLOCATION");
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
