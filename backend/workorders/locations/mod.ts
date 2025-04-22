import OpenAI from "npm:openai";
import { getDistance } from "https://esm.sh/geolib@3.3.4";
const API_ROOT =
  "https://esm.town/v/wolf/fixItWand/backend/workorders/locations";

const openai = new OpenAI();

export interface Site {
  SiteId: number;
  SiteName: string;
  ColorCode: string;
  RegionId: number;
  RegionName: string;
  CompanyName: string;
  IsBillingSame: boolean;
  IsShippingSame: boolean;
  TimeZone: string;
  EstimatedHours: number;
  ApplyToAllExclusions: boolean;
  RowVersion: string;
  IsAdd: boolean;
}

interface RegionsResponse {
  Items: Site[];
}

/**
 * Retrieves the regions data from the regions.json file
 * @returns Promise that resolves to an array of Site objects
 */
export async function getSites(): Promise<Site[]> {
  try {
    const response = await fetch(`${API_ROOT}/sites.json`);
    const parsedData = await response.json() as RegionsResponse;
    return parsedData.Items;
  } catch (error) {
    console.error("Error loading regions data:", error);
    return [];
  }
}

export interface Location {
  LocationId: number;
  LocationNo: string;
  LocationName: string;
  Description: string | null;
  Latitude: number;
  Longitude: number;
  Distance: number | null;
  DistanceUnitOfMeasure: string | null;
  ColorCode: string;
  SiteId: number;
  ParentLocationId: number | null;
  ParentLocationName: string | null;
  Path: string;
  SiteName: string;
  SiteNo: string | null;
  RegionName: string;
  RegionNo: string | null;
  LocationStatusId: number;
  LocationStatusName: string;
  LocationStatusNo: string | null;
  LocationStatusColor: string | null;
  Addr1: string;
  Addr2: string | null;
  City: string;
  PostalCode: string;
  StateProvince: string;
  CountryCode: string;
  IsAutoGenarate: boolean;
  EstimatedHours: number;
  Building: boolean;
  SquareFootage: number;
  LastModifiedBy: string;
  LastModifiedOn: string;
  RowVersion: string;
  IsAdd: boolean;
}

interface LocationsResponse {
  Items: Location[];
}

/**
 * Retrieves the locations for a specific site ID
 * @param siteId The ID of the site to get locations for
 * @returns Promise that resolves to an array of Location objects
 */
export async function getLocationBySiteId(
  siteId: number,
): Promise<Location[]> {
  try {
    const response = await fetch(`${API_ROOT}/locations/${siteId}.json`);
    const parsedData = await response.json() as LocationsResponse;
    return parsedData.Items;
  } catch (error) {
    console.error(`Error loading locations for site ${siteId}:`, error);
    return [];
  }
}

/**
 * Finds the nearest location to the specified latitude and longitude
 * @param latitude The latitude to search from
 * @param longitude The longitude to search from
 * @returns Promise that resolves to the nearest Location object or null if none found
 */
export async function getNearest(
  latitude: number,
  longitude: number,
): Promise<Location | null> {
  try {
    // Get all sites
    const sites = await getSites();

    let allLocations: Location[] = [];

    // Get locations for each site
    for (const site of sites) {
      const locations = await getLocationBySiteId(site.SiteId);
      allLocations = [...allLocations, ...locations];
    }

    if (allLocations.length === 0) {
      return null;
    }

    // Calculate distance for each location
    const locationsWithDistance = allLocations.map((location) => {
      const distance = getDistance(
        { latitude, longitude },
        { latitude: location.Latitude, longitude: location.Longitude },
      );

      return {
        ...location,
        calculatedDistance: distance,
      };
    });

    // Sort by distance and return the closest
    locationsWithDistance.sort((a, b) =>
      a.calculatedDistance - b.calculatedDistance
    );

    return locationsWithDistance[0];
  } catch (error) {
    console.error("Error finding nearest location:", error);
    return null;
  }
}

/**
 * Search for a location by name using GPT-4o-mini
 * @param query The search query for the location name
 * @returns Promise that resolves to the found Location object or null if none found
 */
export async function search(query: string): Promise<Location | null> {
  try {
    // Get all sites
    const sites = await getSites();

    // Get locations for each site
    let allLocations: Location[] = [];
    for (const site of sites) {
      const locations = await getLocationBySiteId(site.SiteId);
      allLocations = [...allLocations, ...locations];
    }

    // Create a simplified list of location names and IDs
    const locationsList = allLocations.map((location) => [
      location.LocationName,
      location.LocationId,
    ]);

    // Use GPT-4o-mini to find the best match
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a location matching assistant. Given a user query and a list of locations, " +
            "find the most relevant location ID that matches the query. Return ONLY the ID number, no other text.",
        },
        {
          role: "user",
          content:
            `Find the location ID that best matches: "${query}"\n\nLocations: ${
              JSON.stringify(locationsList)
            }`,
        },
      ],
      max_tokens: 20,
    });

    // Extract the location ID from the response
    const locationIdStr = chatResponse.choices[0].message.content?.trim();
    if (!locationIdStr) {
      return null;
    }

    // Convert to number and find the matching location
    const locationId = parseInt(locationIdStr, 10);
    if (isNaN(locationId)) {
      return null;
    }

    const foundLocation = allLocations.find((loc) =>
      loc.LocationId === locationId
    );
    return foundLocation || null;
  } catch (error) {
    console.error("Error searching for location:", error);
    return null;
  }
}
