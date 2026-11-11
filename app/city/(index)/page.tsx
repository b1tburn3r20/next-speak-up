import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Building2 } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Grid, PageHeader, PageSpacer, Section, Stack } from "@/components/blocks";
import { FindHomeCity } from "@/components/city/find-home-city";
import { listCities } from "@/lib/civic/city-registry";
import { getStateLocation, getUserState } from "@/lib/civic/state";
import { STATES } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";

export const metadata: Metadata = { title: "My city", description: "Your mayor, your city council, and how to speak at its meetings." };

/** "My City" in the nav. Someone whose city we know goes straight there. Anyone else is asked once. */
export default async function MyCityPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const state = userId ? await getUserState(userId) : null;
  const location = userId && state ? await getStateLocation(userId, state) : null;
  if (state && location?.city) redirect(stateRoutes(state.key).city(location.city.key));

  if (state) {
    const routes = stateRoutes(state.key);
    const { cities } = await listCities(state, { take: 8 });
    return (
      <PageSpacer width="narrow">
        <PageHeader title="My city" description="City Hall decides what's closest to home: streets, parks, zoning, and the city budget." />
        <FindHomeCity stateKey={state.key} stateName={state.name} citiesHref={routes.cities} />
        <Section title={`${state.name}'s biggest cities`} action={{ href: routes.cities, label: "All of them" }}>
          <Grid cols="halves">
            {cities.map((city) => (
              <Link key={city.jurisdictionId} href={routes.city(city.slug)} className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-4 hover:bg-muted" data-testid="my-city-option">
                <Building2 className="size-5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 break-words font-extrabold">{city.name}</span>
                <ArrowRight className="size-4 shrink-0" aria-hidden />
              </Link>
            ))}
          </Grid>
        </Section>
      </PageSpacer>
    );
  }

  return (
    <PageSpacer width="narrow">
      <PageHeader
        title="My city"
        description={
          userId
            ? "We cover the cities in these states so far. Set your location to one of them, and your city shows up here."
            : "We cover the cities in these states so far. Sign in and add your location, and your city shows up here."
        }
      />
      <Stack>
        {STATES.map((option) => (
          <Link
            key={option.key}
            href={stateRoutes(option.key).cities}
            className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-4 hover:bg-muted"
            data-testid="my-city-state"
          >
            <Building2 className="size-6 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1 font-extrabold">Cities in {option.name}</span>
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
        ))}
      </Stack>
    </PageSpacer>
  );
}
