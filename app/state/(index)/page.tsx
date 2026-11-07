import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, Landmark } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PageHeader, PageSpacer, Stack } from "@/components/blocks";
import { getUserState } from "@/lib/civic/state";
import { STATES } from "@/lib/civic/states";
import { stateRoutes } from "@/lib/routes";

export const metadata: Metadata = { title: "States", description: "The states we cover so far." };

/** "My state" in the nav. People in a state we cover go straight there. */
export default async function StatesPage() {
  const session = await getServerSession(authOptions);
  const state = session?.user?.id ? await getUserState(session.user.id) : null;
  if (state) redirect(stateRoutes(state.key).home);
  return (
    <PageSpacer width="narrow">
      <PageHeader title="States" description="The states we cover so far. More will follow." />
      <Stack>
        {STATES.map((option) => (
          <Link
            key={option.key}
            href={stateRoutes(option.key).home}
            className="flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-card p-4 hover:bg-muted"
            data-testid="state-option"
          >
            <Landmark className="size-6 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1 font-extrabold">{option.name}</span>
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
        ))}
      </Stack>
    </PageSpacer>
  );
}
