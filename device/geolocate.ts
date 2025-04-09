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

  try {
    const response = await fetch(
      `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data: GeolocationResponse = await response.json();

    return data;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
