import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OuterBlock } from "@/components/blocks";
import { partyAdjective } from "@/lib/civic/labels";
import { memberKeyOf, type MemberCard as MemberData } from "@/lib/civic/people";
import { memberPath } from "@/lib/routes";
import { MemberPhoto } from "./member-photo";
import { seatOf } from "./seat";

/**
 * A long list of people as short rows in one card: face, name, party, and seat. A directory reads faster
 * this way than as a stack of cards, and a phone shows four times as many at once.
 */
export function MemberList({ members, testId }: { members: MemberData[]; testId?: string }) {
  return (
    <OuterBlock className="p-0 sm:p-0" data-testid={testId}>
      <ul className="divide-y">
        {members.map((member) => {
          const key = memberKeyOf(member);
          const term = member.terms[0];
          const body = (
            <>
              <MemberPhoto name={member.fullName} url={member.imageUrl} party={term?.party} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block break-words font-extrabold leading-snug">{member.fullName}</span>
                {term ? (
                  <span className="block text-sm text-muted-foreground">
                    {partyAdjective(term.party)}, {seatOf(term, key)}
                  </span>
                ) : null}
              </span>
            </>
          );
          return (
            <li key={member.id}>
              {key ? (
                <Link href={memberPath(key)} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-muted" data-testid="member-card">
                  {body}
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              ) : (
                <div className="flex min-h-14 items-center gap-3 px-4 py-2" data-testid="member-card">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </OuterBlock>
  );
}
