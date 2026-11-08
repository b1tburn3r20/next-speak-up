import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { OuterBlock } from "@/components/blocks";
import { MemberPhoto } from "@/components/people/member-photo";
import type { CityOfficial } from "@/lib/civic/city";
import { seatName } from "@/lib/civic/city-logic";
import { cn } from "@/lib/utils";

/** One official, with how to reach them. City offices are nonpartisan, so there's no party here. */
export function CityOfficialCard({
  official,
  cityName,
  highlight,
  large = false,
  href,
}: {
  official: CityOfficial;
  cityName: string;
  /** Their page. Every card in a city links to it. */
  href?: string;
  /** Shown above the name, like "Your council member". */
  highlight?: string;
  large?: boolean;
}) {
  const term = official.terms[0];
  const seat = seatName(term?.role ?? "", term?.district?.code);
  return (
    <OuterBlock className={cn("min-w-0 space-y-3", highlight && "border-primary bg-primary-tint")} data-testid="city-official" data-seat={seat}>
      {highlight ? <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{highlight}</p> : null}
      <div className="flex min-w-0 items-center gap-3">
        <MemberPhoto name={official.fullName} url={official.imageUrl} party={null} size={large ? 88 : 56} />
        <div className="min-w-0">
          <p className={cn("break-words font-extrabold leading-snug", large ? "text-xl" : "")} data-testid="city-official-name">
            {href ? (
              <Link href={href} className="hover:underline">
                {official.fullName}
              </Link>
            ) : (
              official.fullName
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {term?.role === "MAYOR" ? `Mayor of ${cityName}` : `Council member, ${seat}`}
            {term?.endYear ? ` · Term ends ${term.endYear}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {official.phone ? (
          <a href={`tel:${official.phone.replace(/[^\d]/g, "")}`} className="tap inline-flex items-center gap-1.5 font-bold text-primary hover:underline">
            <Phone className="size-4" aria-hidden />
            {official.phone}
          </a>
        ) : null}
        {official.email ? (
          <a href={`mailto:${official.email}`} className="tap inline-flex min-w-0 items-center gap-1.5 break-all font-bold text-primary hover:underline">
            <Mail className="size-4 shrink-0" aria-hidden />
            {official.email}
          </a>
        ) : null}
      </div>
    </OuterBlock>
  );
}
