import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimateBlock from "@/components/cb/animate-block";
import { TextAnimate } from "@/components/magicui/text-animate";
import { MemberCard } from "@/components/people/member-card";
import { Button } from "@/components/ui/button";
import { listCurrentMembers } from "@/lib/civic/people";

const LearnYourReps = async () => {
  // An example card. The landing page has to keep working if no data is loaded yet.
  const [sample] = await listCurrentMembers({ state: "TX", chamber: "UPPER" }).catch(() => []);

  return (
    <div className="flex flex-wrap gap-4">
      {sample ? (
        <div className="w-full lg:w-80">
          <MemberCard member={sample} />
        </div>
      ) : null}
      <AnimateBlock className="flex flex-1">
        <div className="flex-1 space-y-6 text-center lg:space-y-8 lg:text-left">
          <TextAnimate
            animation="blurInUp"
            by="word"
            className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl [&>span:last-child]:text-primary"
            as="h1"
          >
            Learn your Rep
          </TextAnimate>
          <p className="mx-auto max-w-prose text-base text-muted-foreground lg:mx-0">
            Coolbills lets you weigh in on the same bills your representatives voted on, so you
            can see how often they vote the way you would.
          </p>
          <div>
            <Link href="/legislators">
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
