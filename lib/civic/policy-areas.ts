// The Library of Congress's policy areas, with plain explanations. Each belongs to one of 8 color
// families. The colors live in globals.css, validated for color blindness on each theme, and are
// never used without the name.

export type PolicyFamily =
  | "economy"
  | "world"
  | "justice"
  | "health"
  | "nature"
  | "places"
  | "learning"
  | "government";

/** A soft background that works on either theme, because it's mixed with the card it sits on. */
function tintOf(color: string): string {
  return `color-mix(in srgb, ${color} 16%, var(--card))`;
}

export const POLICY_FAMILIES: Record<PolicyFamily, { label: string; color: string; tint: string }> = {
  economy: { label: "Money and work", color: "var(--policy-economy)", tint: tintOf("var(--policy-economy)") },
  government: { label: "Government", color: "var(--policy-government)", tint: tintOf("var(--policy-government)") },
  learning: { label: "Learning and culture", color: "var(--policy-learning)", tint: tintOf("var(--policy-learning)") },
  places: { label: "Homes and travel", color: "var(--policy-places)", tint: tintOf("var(--policy-places)") },
  health: { label: "Health and families", color: "var(--policy-health)", tint: tintOf("var(--policy-health)") },
  nature: { label: "Land and energy", color: "var(--policy-nature)", tint: tintOf("var(--policy-nature)") },
  world: { label: "Defense and the world", color: "var(--policy-world)", tint: tintOf("var(--policy-world)") },
  justice: { label: "Law and rights", color: "var(--policy-justice)", tint: tintOf("var(--policy-justice)") },
};

export type PolicyArea = { name: string; slug: string; family: PolicyFamily; explanation: string };

function area(name: string, family: PolicyFamily, explanation: string): PolicyArea {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { name, slug, family, explanation };
}

export const POLICY_AREAS: PolicyArea[] = [
  area("Agriculture and Food", "nature", "Farms, ranching, food safety, and food aid programs."),
  area("Animals", "nature", "Wildlife, pets, animal welfare, and livestock care."),
  area(
    "Armed Forces and National Security",
    "world",
    "The military, veterans, intelligence, and protecting the country.",
  ),
  area(
    "Arts, Culture, Religion",
    "learning",
    "The arts, museums, cultural heritage, and religious matters.",
  ),
  area(
    "Civil Rights and Liberties, Minority Issues",
    "justice",
    "Voting rights, free speech, privacy, discrimination, and equal treatment.",
  ),
  area("Commerce", "economy", "Businesses, consumer protection, and small business programs."),
  area(
    "Congress",
    "government",
    "How Congress itself runs: its rules, staff, buildings, and members.",
  ),
  area(
    "Crime and Law Enforcement",
    "justice",
    "Criminal laws, police, prisons, and federal law enforcement.",
  ),
  area(
    "Economics and Public Finance",
    "economy",
    "The federal budget, spending, debt, and the overall economy.",
  ),
  area("Education", "learning", "Schools, colleges, student aid, and teachers."),
  area(
    "Emergency Management",
    "places",
    "Preparing for and recovering from disasters, like hurricanes and wildfires.",
  ),
  area("Energy", "nature", "Oil, gas, nuclear, renewable power, and the electric grid."),
  area(
    "Environmental Protection",
    "nature",
    "Clean air and water, pollution, climate, and conservation rules.",
  ),
  area("Families", "health", "Child care, adoption, family support, and domestic violence."),
  area(
    "Finance and Financial Sector",
    "economy",
    "Banks, investing, insurance, and consumer credit.",
  ),
  area(
    "Foreign Trade and International Finance",
    "world",
    "Tariffs, trade deals, imports, and exports.",
  ),
  area(
    "Geographic Areas, Entities, and Organizations",
    "places",
    "Matters about particular places or organizations.",
  ),
  area(
    "Government Operations and Politics",
    "government",
    "How federal agencies run, elections, and government workers.",
  ),
  area("Health", "health", "Health care, insurance, medicine, public health, and Medicare."),
  area(
    "Housing and Community Development",
    "places",
    "Affordable housing, mortgages, and support for neighborhoods.",
  ),
  area("Immigration", "world", "Visas, citizenship, asylum, and the border."),
  area("International Affairs", "world", "Diplomacy, foreign aid, sanctions, and treaties."),
  area("Labor and Employment", "economy", "Jobs, wages, unions, and workplace safety."),
  area("Law", "justice", "The federal courts, judges, and how lawsuits work."),
  area("Native Americans", "justice", "Tribal governments, tribal lands, and Native services."),
  area("Private Legislation", "government", "Bills that affect one person or a small group."),
  area(
    "Public Lands and Natural Resources",
    "nature",
    "National parks, federal land, mining, and forests.",
  ),
  area(
    "Science, Technology, Communications",
    "learning",
    "Research, space, the internet, and telecommunications.",
  ),
  area(
    "Social Sciences and History",
    "learning",
    "Historical sites, commemorations, and research about society.",
  ),
  area("Social Welfare", "health", "Social Security, disability benefits, and aid for families."),
  area("Sports and Recreation", "learning", "Sports, outdoor recreation, and hunting and fishing."),
  area("Taxation", "economy", "Federal taxes, tax credits, and the IRS."),
  area(
    "Transportation and Public Works",
    "places",
    "Roads, bridges, airlines, trains, and public transit.",
  ),
  area("Water Resources Development", "nature", "Dams, levees, water supply, and waterways."),
];

const BY_NAME = new Map(POLICY_AREAS.map((item) => [item.name, item]));
const BY_SLUG = new Map(POLICY_AREAS.map((item) => [item.slug, item]));

export function policyAreaByName(name: string | null | undefined): PolicyArea | null {
  return name ? (BY_NAME.get(name) ?? null) : null;
}

export function policyAreaBySlug(slug: string): PolicyArea | null {
  return BY_SLUG.get(slug) ?? null;
}

/** The family of a policy area. An unknown one still gets shown, in a neutral color. */
export function policyStyle(name: string | null | undefined) {
  const found = policyAreaByName(name);
  if (!found) return { color: "var(--muted-foreground)", tint: "var(--muted)" };
  const family = POLICY_FAMILIES[found.family];
  return { color: family.color, tint: family.tint };
}
