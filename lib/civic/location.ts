// Turns a location into a state and congressional district, using the free Census geocoder.
// Coordinates and addresses are only used for the lookup, and are never stored.

const GEOCODER = "https://geocoding.geo.census.gov/geocoder/geographies";
// Long enough for a slow day at the Census, short enough that the page offers choosing by hand instead.
const CENSUS_TIMEOUT_MS = 15_000;

export const AT_LARGE = "AL";

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
  "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
  "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
  "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY", "60": "AS", "66": "GU", "69": "MP", "72": "PR", "78": "VI",
};

export type StateSeats = { upper: string | null; lower: string | null; placeGeoid: string | null };
export type ResolvedDistrict = { regionCode: string; districtCode: string; stateSeats?: StateSeats };

/**
 * Normalizes a district to the code stored in the database. The Census uses "00" for
 * at-large seats and "98" for delegates, and other sources use null or 0.
 */
export function normalizeDistrict(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value).trim();
  if (["", "0", "00", "98", AT_LARGE].includes(text)) return AT_LARGE;
  const number = Number.parseInt(text, 10);
  return Number.isNaN(number) ? AT_LARGE : String(number);
}

/**
 * Reads the district out of a geocoder response. The layer and field names include the
 * Congress number, such as "119th Congressional Districts" and CD119, so they're matched by
 * pattern. That way, the next Congress doesn't silently break this.
 */
export function parseGeographies(geographies: unknown): ResolvedDistrict | null {
  if (!geographies || typeof geographies !== "object") return null;
  const layers = geographies as Record<string, unknown>;
  const layerName = Object.keys(layers).find((name) => /Congressional Districts?$/i.test(name));
  const entries = layerName ? layers[layerName] : null;
  const district = Array.isArray(entries) ? (entries[0] as Record<string, unknown>) : null;
  if (!district) return null;

  const regionCode = FIPS_TO_STATE[String(district.STATE)];
  const districtField = Object.keys(district).find((key) => /^CD\d+$/.test(key));
  if (!regionCode || !districtField) return null;
  const seats = parseStateSeats(layers);
  return {
    regionCode,
    districtCode: normalizeDistrict(district[districtField] as string),
    ...(seats.upper || seats.lower ? { stateSeats: seats } : {}),
  };
}

/** The layer names carry a year, like "2024 State Legislative Districts - Upper", so they're matched by pattern. */
function parseStateSeats(layers: Record<string, unknown>): StateSeats {
  const first = (pattern: RegExp) => {
    const name = Object.keys(layers).find((key) => pattern.test(key));
    const entries = name ? layers[name] : null;
    return Array.isArray(entries) ? (entries[0] as Record<string, unknown> | undefined) : undefined;
  };
  const seat = (entry: Record<string, unknown> | undefined) => {
    const number = Number.parseInt(String(entry?.BASENAME ?? ""), 10);
    return Number.isInteger(number) ? String(number) : null;
  };
  const place = first(/^Incorporated Places$/i);
  return {
    upper: seat(first(/State Legislative Districts? - Upper$/i)),
    lower: seat(first(/State Legislative Districts? - Lower$/i)),
    placeGeoid: place?.GEOID ? String(place.GEOID) : null,
  };
}

export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

type Fetcher = typeof fetch;

/** The Congress in office on a date. A new one is seated on January 3 of odd years. */
export function congressOn(date: Date = new Date()): number {
  const year = date.getUTCFullYear();
  const beforeSeating =
    date.getUTCMonth() === 0 && date.getUTCDate() < 3 ? 1 : 0;
  return Math.floor((year - beforeSeating - 1789) / 2) + 1;
}

// The Census's "current" maps move to the next Congress right after an election, weeks before
// its members take office. A map from the wrong Congress matches people to the wrong sitting
// representative: Austin is District 37 for the 119th but District 10 for the 120th. So this
// asks for the map of the Congress in office, and uses "current" only once that's correct.
const VINTAGE_BY_CONGRESS: Record<number, string> = {
  119: "ACS2024_Current",
};

export function censusVintage(date: Date = new Date()): string {
  return VINTAGE_BY_CONGRESS[congressOn(date)] ?? "Current_Current";
}

// Only the layers this file reads: incorporated places, congressional districts, and both state
// legislative chambers. "all" asks the Census for dozens more, and takes 4 to 13 seconds instead of a
// few. The numbers belong to each vintage's map, so a vintage not listed here falls back to "all".
const LAYERS_BY_VINTAGE: Record<string, string> = {
  ACS2024_Current: "28,54,56,58",
};

export function censusLayers(vintage: string): string {
  return LAYERS_BY_VINTAGE[vintage] ?? "all";
}

export type CensusQuery = { lat: number; lng: number } | { address: string };

/**
 * The Census geocoder's address for a lookup. "jsonp" wraps the answer in a call to `callback`, which
 * is how a browser can ask the Census directly: it sends no CORS headers, so a plain fetch from a page
 * can't read the answer. See components/onboarding/census-lookup.ts.
 */
export function censusLookupUrl(query: CensusQuery, format: "json" | "jsonp" = "json", callback?: string): string {
  const vintage = censusVintage();
  const params = new URLSearchParams({ benchmark: "Public_AR_Current", vintage, layers: censusLayers(vintage), format });
  if (format === "jsonp" && callback) params.set("callback", callback);
  if ("address" in query) {
    params.set("address", query.address);
    return `${GEOCODER}/onelineaddress?${params}`;
  }
  params.set("x", String(query.lng));
  params.set("y", String(query.lat));
  return `${GEOCODER}/coordinates?${params}`;
}

/** The district in a Census answer: the point's own, or an address's first match. */
export function parseCensusResult(query: CensusQuery, data: unknown): ResolvedDistrict | null {
  const result = (data as { result?: { geographies?: unknown; addressMatches?: { geographies?: unknown }[] } } | null)?.result;
  return parseGeographies("address" in query ? result?.addressMatches?.[0]?.geographies : result?.geographies);
}

async function readResponse(response: Response) {
  if (!response.ok) throw new Error(`Census geocoder returned ${response.status}`);
  return response.json();
}

/** Asks the Census, and once more if it couldn't even be reached. A slow answer isn't retried, since it'd only be slower. */
async function askCensus(url: string, fetcher: Fetcher) {
  try {
    return await readResponse(await fetcher(url, { cache: "no-store", signal: AbortSignal.timeout(CENSUS_TIMEOUT_MS) }));
  } catch (error) {
    const unreachable = error instanceof TypeError && /fetch failed/i.test(error.message);
    if (!unreachable) throw error;
    return readResponse(await fetcher(url, { cache: "no-store", signal: AbortSignal.timeout(CENSUS_TIMEOUT_MS) }));
  }
}

export async function districtFromCoordinates(
  lat: number,
  lng: number,
  fetcher: Fetcher = fetch,
): Promise<ResolvedDistrict | null> {
  const query = { lat, lng };
  return parseCensusResult(query, await askCensus(censusLookupUrl(query), fetcher));
}

export async function districtFromAddress(
  address: string,
  fetcher: Fetcher = fetch,
): Promise<ResolvedDistrict | null> {
  const query = { address };
  return parseCensusResult(query, await askCensus(censusLookupUrl(query), fetcher));
}
