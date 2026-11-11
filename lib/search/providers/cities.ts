import prisma from "@/prisma/client";
import { STATES, type StateConfig } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";
import { rankResults, scoreFields } from "../score";
import type { SearchProvider } from "../types";

// A state's cities change once a census, so they're held in memory, which lets a typo still match.
const CITIES_TTL_MS = 60 * 60 * 1000;
type CityRow = { slug: string; name: string; population: number | null };
const cache = new Map<string, { loadedAt: number; cities: CityRow[] }>();

async function citiesOf(state: StateConfig): Promise<CityRow[]> {
  const held = cache.get(state.key);
  if (held && Date.now() - held.loadedAt < CITIES_TTL_MS) return held.cities;
  const cities = await prisma.cityProfile.findMany({
    where: { regionCode: state.regionCode },
    select: { slug: true, name: true, population: true },
    // Biggest first, because ties keep this order, and between two equal matches the bigger city is likelier.
    orderBy: [{ population: { sort: "desc", nulls: "last" } }, { name: "asc" }],
  });
  cache.set(state.key, { loadedAt: Date.now(), cities });
  return cities;
}

export const cityProviders: SearchProvider[] = STATES.map((state) => ({
  id: `${state.key}-cities`,
  label: `${state.name} cities`,
  minQueryLength: 2,
  search: async ({ query, limit }) => {
    const cities = await citiesOf(state);
    const results = cities.map((city) => ({
      id: city.slug,
      title: city.name,
      subtitle: city.population ? `${city.population.toLocaleString()} people` : `A city in ${state.name}`,
      href: stateRoutes(state.key).city(city.slug),
      score: scoreFields(query, [{ text: city.name }]),
    }));
    return rankResults(results, limit);
  },
}));
