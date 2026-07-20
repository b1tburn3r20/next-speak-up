import CongressMemberCard from "@/app/legislators/federal/[bioguideId]/components/CongressMemberCard";
import SponsorPolicyAreaBreakdown from "@/app/legislators/federal/[bioguideId]/components/SponsorPolicyAreaBreakdown";
import AnimateBlock from "@/components/cb/animate-block";
import FutureFeatureWrapper from "@/components/cb/future-feature-wrapper";
import InmostBlock from "@/components/cb/inmost-block";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Button } from "@/components/ui/button";
import { getComprehensiveLegislatorInformation, getLegislatorSponsorshipPolicyAreaBreakdown } from "@/lib/services/legislators/legislator-id";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const SAMPLE_BIOGUIDE_ID = "N000193"

const LearnYourReps = async () => {

  const [memberData, { breakdown }] = await Promise.all([
    getComprehensiveLegislatorInformation(SAMPLE_BIOGUIDE_ID),
    getLegislatorSponsorshipPolicyAreaBreakdown(SAMPLE_BIOGUIDE_ID),
  ]);
  return (
    <div className="flex gap-4 flex-wrap">
      <div className="flex flex-col lg:flex-row gap-4 h-full">
        <CongressMemberCard congressMember={memberData} />
        <SponsorPolicyAreaBreakdown data={breakdown} />
      </div>
      <AnimateBlock className="flex flex-1">
        <div className="space-y-6 lg:space-y-8 text-center lg:text-left flex-1">
          <TextAnimate
            animation="blurInUp"
            by="word"
            className="font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight [&>span:last-child]:text-primary"
            as="h1"
          >
            Learn your Rep
          </TextAnimate>
          <p className="text-muted-foreground text-base text-md max-w-prose mx-auto lg:mx-0">
            Coolbills gives you the tools to "vote" on bills your representative also voted on so you can get a representative alignment, so come re-election time you can definitively say whether or not you align with your representative.
          </p>{" "}
          <div>
            <Link href={"/legislators"}>
              <Button size="lg" className="w-full sm:w-auto">
                Show me! <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </AnimateBlock>
    </div>
  );
};

export default LearnYourReps;
