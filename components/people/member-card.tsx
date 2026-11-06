import Link from "next/link";
import { partyAdjective, roleLabel, seatLabel } from "@/lib/civic/labels";
import { bioguideOf, type MemberCard as MemberData } from "@/lib/civic/people";
import { MemberPhoto } from "./member-photo";
import { stateName } from "./state-name";
import { memberPath } from "@/lib/routes";

export { MemberPhoto, stateName };

export function MemberCard({ member, extra }: { member: MemberData; extra?: React.ReactNode }) {
  const bioguide = bioguideOf(member);
  const term = member.terms[0];
  const body = (
    <div className="flex min-w-0 items-center gap-3">
      <MemberPhoto name={member.fullName} url={member.imageUrl} party={term?.party} size={56} />
      <div className="min-w-0">
        <p className="break-words font-extrabold leading-snug">{member.fullName}</p>
        {term ? (
          <p className="text-sm text-muted-foreground">
            {partyAdjective(term.party)} {roleLabel(term.role).toLowerCase()},{" "}
            {seatLabel(stateName(term.regionCode), term.district?.code, term.chamber.kind)}
          </p>
        ) : null}
        {extra}
      </div>
    </div>
  );
  const className = "block rounded-2xl border-2 border-b-4 bg-card p-3 text-card-foreground";
  return bioguide ? (
    <Link
      href={memberPath(bioguide)}
      className={`${className} transition-colors hover:border-primary/60`}
      data-testid="member-card"
    >
      {body}
    </Link>
  ) : (
    <div className={className} data-testid="member-card">
      {body}
    </div>
  );
}
