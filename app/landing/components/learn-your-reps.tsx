import Link from "next/link";
import { CalendarClock, Scale, Vote } from "lucide-react";
import { Grid, OuterBlock } from "@/components/blocks";
import { MemberCard } from "@/components/people/member-card";
import { buttonVariants } from "@/components/ui/button";
import { listCurrentMembers } from "@/lib/civic/people";
import { routes } from "@/lib/routes";

const STEPS = [
  {
    icon: Scale,
    title: "Meet your reps",
    body: "See your representative and senators in a few seconds.",
  },
  {
    icon: Vote,
    title: "Vote, then find out",
    body: "Weigh in on real bills. Their vote stays hidden until you've voted.",
  },
  {
    icon: CalendarClock,
    title: "Get ahead of Congress",
    body: "See what may come up next week, in plain words, and weigh in first.",
  },
];

const LearnYourReps = async () => {
  // The landing page has to keep working if no data is loaded yet.
  const samples = await listCurrentMembers({ chamber: "UPPER", state: "TX" }).catch(() => []);
  return (
    <div className="space-y-6">
      <Grid cols="cards">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <OuterBlock key={title} className="space-y-2">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-tint">
              <Icon className="size-5 text-primary" aria-hidden />
            </span>
            <h2 className="text-lg font-extrabold">{title}</h2>
            <p className="text-muted-foreground">{body}</p>
          </OuterBlock>
        ))}
      </Grid>
      {samples.length > 0 ? (
        <div className="space-y-3">
          <Grid cols="halves">
            {samples.slice(0, 2).map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </Grid>
          <div className="text-center">
            <Link href={routes.federal.legislators} className={buttonVariants({ variant: "outline", size: "lg" })}>
              Find your own reps
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LearnYourReps;
