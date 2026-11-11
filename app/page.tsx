import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowRight, Building, Building2, Landmark, Lock, MessageSquareText, Scale, UserCheck, Vote } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Grid, OuterBlock, PageSpacer, Section } from "@/components/blocks";
import { Disclosure } from "@/components/ui/disclosure";
import { buttonVariants } from "@/components/ui/button";
import { floorBoardBillIds, getFloorBoard } from "@/lib/civic/floor";
import { STATES } from "@/lib/civic/states";
import { routes, stateRoutes } from "@/lib/routes";
import prisma from "@/prisma/client";
import Hero from "./landing/components/hero";

export const metadata: Metadata = {
  title: "Coolbills | Does your representative represent you?",
  description: "Vote on the same bills your representatives do, in plain words, then find out if they vote like you. Congress, your statehouse, and City Hall.",
};

/** Real numbers for the front page. It has to keep working before any data is loaded. */
async function frontPageFacts() {
  try {
    const [board, congress, cities] = await Promise.all([
      getFloorBoard(new Date()),
      prisma.officeTerm.count({ where: { isCurrent: true, chamber: { jurisdiction: { code: "US" } } } }),
      prisma.cityProfile.count(),
    ]);
    return { floor: floorBoardBillIds(board).length, congress, cities };
  } catch {
    return { floor: 0, congress: 0, cities: 0 };
  }
}

const STEPS = [
  { icon: Scale, title: "Meet your reps", body: "Tell us where you live. See the faces of everyone who votes for you, from Congress to City Hall." },
  { icon: Vote, title: "Vote first", body: "Support or oppose the same bills they vote on, explained in plain words. Their vote stays hidden until you've made yours." },
  { icon: UserCheck, title: "See if you match", body: "Find out how they voted, and over time, whether they really represent you." },
];

const PROMISES = [
  { icon: Scale, title: "You decide", body: "We never tell you which party or side is right. Only your own votes decide who matches you." },
  { icon: Lock, title: "Your votes are yours", body: "Nobody else sees how you voted. Not other people, and not your reps." },
  { icon: MessageSquareText, title: "Plain words", body: "Every bill gets a short explanation, and any hard word can be tapped to explain it." },
];

const QUESTIONS = [
  ["Is it free?", "Yes. There's nothing to buy, and no ads."],
  ["Do I have to sign up?", "No. You can vote on bills right away. Signing up saves your votes, so you can see if your reps match you over time."],
  ["Where does the information come from?", "Official sources: Congress.gov, the House and Senate, each state's legislature, and each city's own website. When something's missing, we say so instead of guessing."],
  ["What if my state isn't here yet?", "Congress works for everyone, everywhere. We're adding states one at a time, starting with Iowa and all 940 of its cities."],
] as const;

/**
 * The front page: what Coolbills is, for someone who's never seen it. One idea (does your rep represent
 * you), how it works in three steps, what it covers, and one way in. The logo always leads here.
 */
export default async function FrontPage() {
  const session = await getServerSession(authOptions);
  const signedIn = Boolean(session?.user);
  const facts = await frontPageFacts();
  const firstState = STATES[0];

  const levels = [
    {
      icon: Landmark,
      title: "Congress",
      body: facts.floor > 0 ? `${facts.floor} bills may come up for a vote soon. Weigh in before they do.` : "Your representative and two senators, and every bill they vote on.",
      href: routes.federal.upcoming,
      cta: "See upcoming votes",
    },
    {
      icon: Building,
      title: "Your statehouse",
      body: firstState ? `${firstState.name}'s legislators, bills, and committee meetings, with more states on the way.` : "Your state legislators and their bills.",
      href: firstState ? stateRoutes(firstState.key).home : routes.states,
      cta: firstState ? `See ${firstState.name}` : "See states",
    },
    {
      icon: Building2,
      title: "City Hall",
      body: facts.cities > 0 ? `Your mayor, City Hall, and when the council meets. ${facts.cities.toLocaleString()} cities so far, with reminders before meetings.` : "Your mayor, City Hall, and when the council meets.",
      href: routes.myCity,
      cta: "Find your city",
    },
  ];

  return (
    <PageSpacer className="space-y-12 sm:space-y-16">
      <Hero signedIn={signedIn} />

      <Section title="How it works" data-testid="front-how">
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title}>
              <OuterBlock className="h-full space-y-2">
                <span className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-tint font-extrabold text-primary">{index + 1}</span>
                  <Icon className="size-5 text-primary" aria-hidden />
                </span>
                <h3 className="text-lg font-extrabold">{title}</h3>
                <p className="text-muted-foreground">{body}</p>
              </OuterBlock>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="From Congress to City Hall" description="Every level of government that votes for you, in one place." data-testid="front-levels">
        <Grid cols="cards">
          {levels.map(({ icon: Icon, title, body, href, cta }) => (
            <Link key={title} href={href} className="group flex h-full flex-col gap-2 rounded-2xl border-2 border-b-4 bg-card p-5 hover:bg-muted" data-testid="front-level">
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="text-lg font-extrabold">{title}</h3>
              <p className="flex-1 text-muted-foreground">{body}</p>
              <span className="inline-flex items-center gap-1 font-extrabold text-primary">
                {cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </Grid>
      </Section>

      <Section title="Our promises" action={{ href: "/mission", label: "Read our mission" }}>
        <Grid cols="cards">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
                <Icon className="size-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-extrabold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </Grid>
      </Section>

      <Section title="Questions" data-testid="front-questions">
        <OuterBlock className="divide-y-2 p-0">
          {QUESTIONS.map(([question, answer]) => (
            <Disclosure key={question} title={question} className="px-4 py-2">
              <p className="pb-2 text-muted-foreground">{answer}</p>
            </Disclosure>
          ))}
        </OuterBlock>
        <p className="text-sm text-muted-foreground">
          Something else?{" "}
          <Link href="/feedback" className="font-bold text-primary hover:underline">
            Ask us
          </Link>
          .
        </p>
      </Section>

      <OuterBlock className="space-y-3 text-center" data-testid="front-final">
        <h2 className="text-2xl font-extrabold">{signedIn ? "Pick up where you left off" : "Try one bill. It takes a minute."}</h2>
        <p className="text-muted-foreground">{signedIn ? "Your next vote, your reps, and what's happening this week." : "No account needed to start. Sign up after, to keep your votes."}</p>
        <Link href={signedIn ? routes.dashboard : routes.vote} className={buttonVariants({ size: "lg" })}>
          {signedIn ? "Go to your Home" : "Vote on a real bill"}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </OuterBlock>
    </PageSpacer>
  );
}
