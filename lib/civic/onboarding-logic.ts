// What to suggest in onboarding. Pure logic.
//
// These are judgment calls about what tends to touch someone's stage of life and where they live.
// They aren't claims about what anyone believes, and the screen says they can be changed.

export const AGE_OPTIONS = [
  { value: "UNDER_18", label: "Under 18" },
  { value: "FROM_18_TO_24", label: "18 to 24" },
  { value: "FROM_25_TO_34", label: "25 to 34" },
  { value: "FROM_35_TO_44", label: "35 to 44" },
  { value: "FROM_45_TO_54", label: "45 to 54" },
  { value: "FROM_55_TO_64", label: "55 to 64" },
  { value: "FROM_65_TO_74", label: "65 to 74" },
  { value: "OVER_75", label: "75 or older" },
  { value: "PREFER_NOT_TO_SAY", label: "I'd rather not say" },
] as const;

export type AgeRangeValue = (typeof AGE_OPTIONS)[number]["value"];

const EDUCATION = "Education";
const JOBS = "Labor and Employment";
const HOUSING = "Housing and Community Development";
const TECH = "Science, Technology, Communications";
const ENVIRONMENT = "Environmental Protection";
const FAMILIES = "Families";
const HEALTH = "Health";
const TAXES = "Taxation";
const ECONOMY = "Economics and Public Finance";
const FINANCE = "Finance and Financial Sector";
const SOCIAL = "Social Welfare";
const MILITARY = "Armed Forces and National Security";
const IMMIGRATION = "Immigration";
const FARMS = "Agriculture and Food";
const LANDS = "Public Lands and Natural Resources";
const DISASTERS = "Emergency Management";
const ENERGY = "Energy";

const BY_AGE: Record<AgeRangeValue, string[]> = {
  UNDER_18: [EDUCATION, TECH, ENVIRONMENT, JOBS, HEALTH],
  FROM_18_TO_24: [EDUCATION, JOBS, HOUSING, TECH, HEALTH],
  FROM_25_TO_34: [HOUSING, JOBS, HEALTH, FAMILIES, TAXES],
  FROM_35_TO_44: [FAMILIES, HOUSING, HEALTH, TAXES, EDUCATION],
  FROM_45_TO_54: [HEALTH, TAXES, JOBS, EDUCATION, ECONOMY],
  FROM_55_TO_64: [HEALTH, SOCIAL, TAXES, FINANCE, JOBS],
  FROM_65_TO_74: [HEALTH, SOCIAL, TAXES, MILITARY, ECONOMY],
  OVER_75: [HEALTH, SOCIAL, TAXES, MILITARY, FAMILIES],
  PREFER_NOT_TO_SAY: [HEALTH, TAXES, ECONOMY, EDUCATION, IMMIGRATION],
};

// A state's most distinctive federal issue. Most federal bills on these fall on a few states.
const BY_STATE: Record<string, string> = {
  ...Object.fromEntries(["AZ", "TX", "NM", "CA"].map((state) => [state, IMMIGRATION])),
  ...Object.fromEntries(
    ["IA", "NE", "KS", "SD", "MN", "IL", "IN", "MO", "WI", "AR"].map((state) => [state, FARMS]),
  ),
  ...Object.fromEntries(["MT", "ID", "UT", "NV", "CO", "OR", "AK"].map((state) => [state, LANDS])),
  ...Object.fromEntries(["FL", "LA", "MS", "AL", "SC", "NC", "HI"].map((state) => [state, DISASTERS])),
  ...Object.fromEntries(["ND", "WV", "OK", "WY", "PA"].map((state) => [state, ENERGY])),
};

export const SUGGESTED_TOPIC_COUNT = 6;

/** Up to six policy areas, with the one most tied to their state first. */
export function suggestTopics(ageRange: string | null | undefined, regionCode?: string | null): string[] {
  const byAge = BY_AGE[(ageRange ?? "PREFER_NOT_TO_SAY") as AgeRangeValue] ?? BY_AGE.PREFER_NOT_TO_SAY;
  const local = regionCode ? BY_STATE[regionCode.toUpperCase()] : undefined;
  const extras = [ECONOMY, HEALTH, TAXES, IMMIGRATION, ENVIRONMENT];
  return [...new Set([...(local ? [local] : []), ...byAge, ...extras])].slice(0, SUGGESTED_TOPIC_COUNT);
}
