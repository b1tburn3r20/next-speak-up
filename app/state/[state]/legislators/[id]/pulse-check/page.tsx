import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { VoteSkeleton } from "@/components/app/skeletons";
import { PulseCheckPage } from "@/components/people/pulse-check-page";
import { memberKeyOf } from "@/lib/civic/people";
import { pulseSize } from "@/lib/civic/pulse-check";
import { getStateLegislator } from "@/lib/civic/state";
import { stateByKey } from "@/lib/civic/states";
import { memberPath } from "@/lib/routes";

type PageProps = { params: Promise<{ state: string; id: string }>; searchParams: Promise<{ count?: string }> };

async function legislatorFrom(params: PageProps["params"]) {
  const { state: key, id } = await params;
  const state = stateByKey(key);
  if (!state) notFound();
  return getStateLegislator(state, decodeURIComponent(id));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const member = await legislatorFrom(params);
  return { title: member ? `Pulse check: ${member.fullName}` : "Legislator not found", robots: { index: false } };
}

async function Body({ params, searchParams }: PageProps) {
  const member = await legislatorFrom(params);
  if (!member) notFound();
  const key = memberKeyOf(member);
  const memberHref = key ? memberPath(key) : "/";
  return (
    <PulseCheckPage
      member={{ id: member.id, fullName: member.fullName, imageUrl: member.imageUrl, party: member.terms[0]?.party ?? null }}
      memberHref={memberHref}
      pulseHref={`${memberHref}/pulse-check`}
      size={pulseSize((await searchParams).count)}
      userId={(await getServerSession(authOptions))?.user?.id ?? null}
    />
  );
}

/** A quick run of a state legislator's bills, then how you line up with them on just those. */
export default async function StatePulseCheckPage(props: PageProps) {
  if (!(await legislatorFrom(props.params))) notFound();
  return (
    <Suspense fallback={<VoteSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}
