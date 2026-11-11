import Link from "next/link";
import { ArrowRight, Check, HelpCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";

/** A small picture of the idea: you vote, then you find out. */
function HowItFeels() {
  return (
    <div className="space-y-3 rounded-3xl border-2 border-b-8 bg-card p-5" aria-hidden>
      <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Your rep just voted</p>
      <p className="text-lg font-extrabold leading-snug">A bill about something you care about</p>
      <div className="grid grid-cols-2 gap-2">
        <span className={buttonVariants({ variant: "support", size: "lg" })}>
          <ThumbsUp className="size-4" /> Support
        </span>
        <span className={buttonVariants({ variant: "outline", size: "lg" })}>
          <ThumbsDown className="size-4" /> Oppose
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint">
          <HelpCircle className="size-6 text-primary" />
        </span>
        <span className="min-w-0 flex-1 font-bold leading-snug">Your rep voted yes</span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-support-tint px-2.5 py-1 text-xs font-extrabold text-support">
          <Check className="size-3.5" /> You match
        </span>
      </div>
    </div>
  );
}

/** The first screen: the one question this app answers, and one way to start. */
const Hero = ({ signedIn }: { signedIn: boolean }) => {
  return (
    <section className="grid items-center gap-8 pt-2 sm:pt-8 lg:grid-cols-2" data-testid="front-hero">
      <div className="space-y-5 text-center lg:text-left">
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
          Does your representative <span className="text-primary">represent you?</span>
        </h1>
        <p className="mx-auto max-w-prose text-lg text-muted-foreground lg:mx-0">
          Vote on the same bills they do, explained in plain words. Then find out if the people you elected, from Congress to City
          Hall, vote like you.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start">
          <Link href={signedIn ? routes.dashboard : routes.vote} className={buttonVariants({ size: "lg" })} data-testid="hero-cta">
            {signedIn ? "Go to your Home" : "Try it: vote on a bill"}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href={routes.reps} className={buttonVariants({ variant: "outline", size: "lg" })}>
            See who represents you
          </Link>
        </div>
      </div>
      <HowItFeels />
    </section>
  );
};

export default Hero;
