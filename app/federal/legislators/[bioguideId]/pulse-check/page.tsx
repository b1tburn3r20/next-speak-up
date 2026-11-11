import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { VoteSkeleton } from "@/components/app/skeletons";
import { PulseCheckPage } from "@/components/people/pulse-check-page";
import { memberExists } from "@/lib/civic/exists";
import { getMemberByBioguide } from "@/lib/civic/people";
import { pulseSize } from "@/lib/civic/pulse-check";
import { memberPath } from "@/lib/routes";

type PageProps = { params: Promise<{ bioguideId: string }>; searchParams: Promise<{ count?: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const member = await getMemberByBioguide((await params).bioguideId);
  return { title: member ? `Pulse check: ${member.fullName}` : "Member not found", robots: { index: false } };
}

async function Body({ params, searchParams }: PageProps) {
  const { bioguideId } = await params;
  const member = await getMemberByBioguide(bioguideId);
  if (!member) notFound();
  const current = member.terms.find((term) => term.isCurrent) ?? member.terms[0];
  const session = await getServerSession(authOptions);
  const memberHref = memberPath(bioguideId);
  return (
    <PulseCheckPage
      member={{ id: member.id, fullName: member.fullName, imageUrl: member.imageUrl, party: current?.party ?? null }}
      memberHref={memberHref}
      pulseHref={`${memberHref}/pulse-check`}
      size={pulseSize((await searchParams).count)}
      userId={session?.user?.id ?? null}
    />
  );
}

/** A quick run of a member's bills, then how you line up with them on just those. */
export default async function MemberPulseCheckPage(props: PageProps) {
  if (!(await memberExists((await props.params).bioguideId))) notFound();
  return (
    <Suspense fallback={<VoteSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}
