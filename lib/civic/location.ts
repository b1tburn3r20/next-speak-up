// Turns a location into a state and congressional district, using the free Census geocoder.
// Coordinates and addresses are only used for the lookup, and are never stored.

const GEOCODER = "https://geocoding.geo.census.gov/geocoder/geographies";

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

export type ResolvedDistrict = { regionCode: string; districtCode: string };

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
  return {
    regionCode,
    districtCode: normalizeDistrict(district[districtField] as string),
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

function commonParams(): URLSearchParams {
  return new URLSearchParams({
    benchmark: "Public_AR_Current",
    vintage: censusVintage(),
    layers: "all",
    format: "json",
  });
}

async function readResponse(response: Response) {
  if (!response.ok) throw new Error(`Census geocoder returned ${response.status}`);
  return response.json();
}

export async function districtFromCoordinates(
  lat: number,
  lng: number,
  fetcher: Fetcher = fetch,
): Promise<ResolvedDistrict | null> {
  const params = commonParams();
  params.set("x", String(lng));
  params.set("y", String(lat));
  const data = await readResponse(
    await fetcher(`${GEOCODER}/coordinates?${params}`, { cache: "no-store" }),
  );
  return parseGeographies(data?.result?.geographies);
}

export async function districtFromAddress(
  address: string,
  fetcher: Fetcher = fetch,
): Promise<ResolvedDistrict | null> {
  const params = commonParams();
  params.set("address", address);
  const data = await readResponse(
    await fetcher(`${GEOCODER}/onelineaddress?${params}`, { cache: "no-store" }),
  );
  return parseGeographies(data?.result?.addressMatches?.[0]?.geographies);
}
