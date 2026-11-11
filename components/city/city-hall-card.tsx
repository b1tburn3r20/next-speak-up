import { Building2, MapPin, Phone } from "lucide-react";
import { OuterBlock } from "@/components/blocks";
import type { CityProfileRow } from "@/lib/civic/city-registry";

/** City Hall: where it is, how to call, and who the clerk is. Says plainly when we don't have it. */
export function CityHallCard({ profile, fallbackUrl = null }: { profile: CityProfileRow | null; fallbackUrl?: string | null }) {
  const has = profile && (profile.address || profile.phone);
  return (
    <OuterBlock className="scroll-mt-4 space-y-2" data-testid="city-hall" id="city-hall">
      <p className="flex items-center gap-1.5 font-extrabold">
        <Building2 className="size-4 shrink-0 text-primary" aria-hidden />
        City Hall
      </p>
      {has ? (
        <>
          {profile.address ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`}
              target="_blank"
              rel="noreferrer"
              className="tap flex items-start gap-1.5 text-sm font-bold text-primary hover:underline"
              data-testid="city-hall-address"
            >
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {profile.address}
            </a>
          ) : null}
          {profile.phone ? (
            <a href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`} className="tap flex items-center gap-1.5 text-sm font-bold text-primary hover:underline" data-testid="city-hall-phone">
              <Phone className="size-4 shrink-0" aria-hidden />
              {profile.phone}
            </a>
          ) : null}
          {profile.clerkName ? <p className="text-sm">City clerk: {profile.clerkName}</p> : null}
          {profile.governmentType ? <p className="text-sm text-muted-foreground">{profile.governmentType} government</p> : null}
          {profile.directorySource ? (
            <p className="text-xs text-muted-foreground">
              From the {profile.directorySource}
              {profile.directoryAsOf ? `, as of ${profile.directoryAsOf.toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : ""}.
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="no-city-hall">
          We don&apos;t have City Hall&apos;s address or phone yet.
          {(profile?.website ?? fallbackUrl) ? (
            <>
              {" "}
              <a href={(profile?.website ?? fallbackUrl) as string} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
                The city&apos;s own site has them
              </a>
              .
            </>
          ) : null}
        </p>
      )}
    </OuterBlock>
  );
}
