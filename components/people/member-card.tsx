import Image from "next/image";
import Link from "next/link";
import { partyLabel, roleLabel, seatLabel } from "@/lib/civic/labels";
import { bioguideOf, type MemberCard as MemberData } from "@/lib/civic/people";
import { STATE_NAMES } from "@/lib/constants/state-names";

export function stateName(code: string): string {
  return (STATE_NAMES as Record<string, string>)[code] ?? code;
}

export function MemberPhoto({ name, url, size = 48 }: { name: string; url: string | null; size?: number }) {
  if (!url) {
    return (
      <div
        aria-hidden
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold"
      >
        {name.slice(0, 1)}
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
    />
  );
}

export function MemberCard({ member, extra }: { member: MemberData; extra?: React.ReactNode }) {
  const bioguide = bioguideOf(member);
  const term = member.terms[0];
  const body = (
    <div className="flex min-w-0 items-center gap-3">
      <MemberPhoto name={member.fullName} url={member.imageUrl} />
      <div className="min-w-0">
        <p className="truncate font-medium">{member.fullName}</p>
        {term ? (
          <p className="text-sm text-muted-foreground">
            {roleLabel(term.role)}, {seatLabel(stateName(term.regionCode), term.district?.code, term.chamber.kind)}
          </p>
        ) : null}
        {term ? <p className="text-sm text-muted-foreground">{partyLabel(term.party)}</p> : null}
        {extra}
      </div>
    </div>
  );
  const className = "block rounded-lg border bg-card p-3 text-card-foreground shadow-sm";
  return bioguide ? (
    <Link
      href={`/legislators/federal/${bioguide}`}
      className={`${className} transition-colors hover:bg-accent/40`}
      data-testid="member-card"
    >
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
