import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Home } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PageHeader, PageSpacer } from "@/components/blocks";
import { PlaceFinder } from "@/components/state/place-finder";
import { getCityCoverage, getCityIndex } from "@/lib/civic/city-registry";
import { getStateLocation } from "@/lib/civic/state";
import { stateByKey } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";

type StateParams = { params: Promise<{ state: string }> };

async function stateFrom(params: StateParams["params"]) {
  const state = stateByKey((await params).state);
  // The layout already turned away states we don't cover. This keeps the type honest.
  if (!state) notFound();
  return state;
}

export async function generateMetadata({ params }: StateParams): Promise<Metadata> {
  const state = await stateFrom(params);
  return { title: `${state.name} cities`, description: `Every city in ${state.name}: its mayor, City Hall, legislators, and when the council meets.` };
}

/** Every city in the state, searched as you type. The icons on each say how much its page has. */
export default async function StateCitiesPage({ params: route }: StateParams) {
  const state = await stateFrom(route);
  const routes = stateRoutes(state.key);
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const [cities, counts, location] = await Promise.all([
    getCityIndex(state),
    getCityCoverage(state),
    userId ? getStateLocation(userId, state) : Promise.resolve(null),
  ]);
  const home = location?.city ?? null;

  return (
    <PageSpacer>
      <PageHeader
        title={`${state.name} cities`}
        description={`All ${counts.cities.toLocaleString()}, each with its state legislators. We have City Hall for ${counts.withCityHall.toLocaleString()}, the mayor for ${counts.withMayor.toLocaleString()}, and meetings for ${counts.withMeetings.toLocaleString()}.`}
      />
      {home ? (
        <Link
          href={routes.city(home.key)}
          className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-primary bg-primary-tint p-4 hover:bg-muted"
          data-testid="cities-your-city"
        >
          <Home className="size-6 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-extrabold uppercase tracking-wide text-primary">Your city</span>
            <span className="block break-words text-lg font-extrabold">{home.name}</span>
          </span>
          <ArrowRight className="size-5 shrink-0" aria-hidden />
        </Link>
      ) : null}
      <PlaceFinder
        places={cities.map((city) => ({
          key: city.key,
          name: city.name,
          href: routes.city(city.key),
          detail: city.population ? `${city.population.toLocaleString()} people` : undefined,
          flags: { mayor: city.mayor, hall: city.hall, meetings: city.meetings },
        }))}
        label="Search by city"
        placeholder="Type a city"
        filters
        pageSize={30}
        testId="city-list"
        inputTestId="city-search"
        itemTestId="city-list-item"
      />
    </PageSpacer>
  );
}
