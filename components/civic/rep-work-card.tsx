import Link from "next/link";
import { OuterBlock, Stack } from "@/components/blocks";
import { PolicyBars, StatTile } from "@/components/civic/charts";
import { MemberPhoto } from "@/components/people/member-photo";
import { bioguideOf, type MemberCard } from "@/lib/civic/people";
import { comparedToChamber, lawSuccess } from "@/lib/civic/verdict";
import { memberPath } from "@/lib/routes";

export type RepWork = {
  rep: MemberCard;
  stat: {
    sponsoredCount: number;
    becameLawCount: number;
    lawEligibleCount: number;
    lawPercentile: number | null;
  } | null;
  areas: { policyArea: string; sponsoredCount: number; becameLawCount: number }[];
};

/** What a rep works on, and how often their bills become law. */
export function RepWorkCard({ data }: { data: RepWork }) {
  const { rep, stat, areas } = data;
  const term = rep.terms[0];
  const bioguide = bioguideOf(rep);
  const success = stat ? lawSuccess(stat) : null;
  return (
    <OuterBlock data-testid="rep-work">
      <Stack gap="md">
        <div className="flex items-center gap-2">
          <MemberPhoto name={rep.fullName} url={rep.imageUrl} party={term?.party} size={36} />
          <h3 className="min-w-0 break-words font-extrabold leading-snug">
            {bioguide ? (
              <Link href={memberPath(bioguide)} className="hover:underline">
                {rep.fullName}
              </Link>
            ) : (
              rep.fullName
            )}
          </h3>
        </div>
        {success ? (
          <StatTile
            testId="success-rate"
            value={`${success.percent}%`}
            label="Success rate"
            hint={
              <>
                {success.sentence}.{" "}
                {stat ? comparedToChamber(stat.lawPercentile, term?.chamber.kind ?? "LOWER") : null}
              </>
            }
          />
        ) : (
          <p className="text-sm text-muted-foreground">We don&apos;t have a record of bills they&apos;ve sponsored yet.</p>
        )}
        {areas.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-extrabold">What they sponsor bills about</p>
            <PolicyBars
              testId="sponsored-areas"
              label={`Bills ${rep.fullName} sponsored, by policy area`}
              max={5}
              rows={areas.map((area) => ({
                policyArea: area.policyArea,
                value: area.sponsoredCount,
                detail: `${area.becameLawCount} became law`,
              }))}
            />
          </div>
        ) : null}
      </Stack>
    </OuterBlock>
  );
}
