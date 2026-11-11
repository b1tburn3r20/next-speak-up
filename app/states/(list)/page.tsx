import type { Metadata } from "next";
import { PageHeader, PageSpacer } from "@/components/blocks";
import { PlaceFinder, type PlaceItem } from "@/components/state/place-finder";
import { getCityCoverage } from "@/lib/civic/city-registry";
import { getStateCounts } from "@/lib/civic/state";
import { STATES, stateByRegion } from "@/lib/civic/states";
import { US_STATES } from "@/lib/civic/us-states";
import { stateRoutes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "States",
  description: "Every state, and which ones you can follow here: their legislators, bills, cities, and meetings.",
};

/** Every state, ones we cover first. Typing narrows the list right away, in the browser. */
export default async function StatesListPage() {
  const covered = await Promise.all(
    STATES.map(async (state) => {
      const [counts, cities] = await Promise.all([getStateCounts(state), getCityCoverage(state)]);
      return { state, counts, cities };
    }),
  );
  const live: PlaceItem[] = covered.map(({ state, counts, cities }) => ({
    key: state.key,
    name: state.name,
    href: stateRoutes(state.key).home,
    detail: `${counts.members} legislators · ${counts.bills.toLocaleString()} bills · ${cities.cities.toLocaleString()} cities`,
  }));
  const later: PlaceItem[] = US_STATES.filter((option) => !stateByRegion(option.code)).map((option) => ({
    key: option.code.toLowerCase(),
    name: option.name,
    href: null,
    detail: "Coming later",
  }));

  return (
    <PageSpacer>
      <PageHeader
        title="States"
        description={`${STATES.map((state) => state.name).join(" and ")} so far, with every legislator, bill, and city. More states will follow.`}
      />
      <PlaceFinder
        places={[...live, ...later]}
        label="Find a state"
        placeholder="Type a state"
        pageSize={60}
        testId="states-list"
        inputTestId="state-search"
        itemTestId="state-option"
      />
    </PageSpacer>
  );
}
