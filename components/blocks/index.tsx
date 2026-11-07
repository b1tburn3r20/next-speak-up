// The building blocks for every page. See docs/ui-guidelines.md. Spacing, padding, and
// breakpoints live here, so pages don't choose them. None of these need client JavaScript.
import Link from "next/link";
import { cn } from "@/lib/utils";

type Gap = "xs" | "sm" | "md" | "lg" | "xl";

const GAP: Record<Gap, string> = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6",
};

/** The outside of every page: width, gutters, and the space between sections. */
export function PageShell({
  width = "default",
  className,
  children,
  ...rest
}: React.ComponentProps<"div"> & { width?: "default" | "narrow" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full space-y-8 px-4 pb-8 pt-5 sm:px-6 sm:pt-8",
        width === "narrow" ? "max-w-2xl" : "max-w-7xl",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  back,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  action?: React.ReactNode;
}) {
  return (
    <header className="space-y-2">
      {back ? (
        <nav>
          <Link href={back.href} className="tap text-sm font-bold text-primary hover:underline">
            ← {back.label}
          </Link>
        </nav>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
          {description ? <p className="max-w-prose text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
    </header>
  );
}

/**
 * The main column and a side rail that stays in view on a large screen. On a phone everything is
 * one column in order: `lead`, then `rail`, then `children`.
 */
export function WithRail({
  lead,
  rail,
  className,
  children,
}: {
  lead?: React.ReactNode;
  rail: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:grid-rows-[auto_1fr]", className)}>
      {lead ? <div className="min-w-0 lg:col-start-1 lg:row-start-1">{lead}</div> : null}
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        {rail}
      </aside>
      <div className={cn("min-w-0 space-y-8 lg:col-start-1", lead ? "lg:row-start-2" : "lg:row-span-2 lg:row-start-1")}>
        {children}
      </div>
    </div>
  );
}

/** A titled group of content, with an optional link to see the rest. */
export function Section({
  title,
  description,
  action,
  className,
  children,
  ...rest
}: Omit<React.ComponentProps<"section">, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <section className={cn("space-y-3", className)} {...rest}>
      {title ? (
        <div className="space-y-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="min-w-0 break-words text-lg font-extrabold leading-snug">{title}</h2>
            {action ? (
              <Link
                href={action.href}
                className="tap shrink-0 text-sm font-bold text-primary hover:underline"
              >
                {action.label}
              </Link>
            ) : null}
          </div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** A raised card, the main unit of content. */
export function OuterBlock({ className, children, ...rest }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border-2 border-b-4 bg-card p-4 text-card-foreground sm:p-5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Something nested inside a card. */
export function InnerBlock({ className, children, ...rest }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-xl bg-muted p-3 sm:p-4", className)} {...rest}>
      {children}
    </div>
  );
}

const STACK: Record<Gap, string> = {
  xs: "space-y-1",
  sm: "space-y-2",
  md: "space-y-3",
  lg: "space-y-4",
  xl: "space-y-6",
};

export function Stack({
  gap = "md",
  className,
  children,
  ...rest
}: React.ComponentProps<"div"> & { gap?: Gap }) {
  return (
    <div className={cn(STACK[gap], className)} {...rest}>
      {children}
    </div>
  );
}

const ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

/** A row that wraps, so it can't overflow a phone. */
export function Flex({
  gap = "sm",
  align = "center",
  justify = "start",
  nowrap = false,
  className,
  children,
  ...rest
}: React.ComponentProps<"div"> & {
  gap?: Gap;
  align?: keyof typeof ALIGN;
  justify?: keyof typeof JUSTIFY;
  nowrap?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0",
        !nowrap && "flex-wrap",
        GAP[gap],
        ALIGN[align],
        JUSTIFY[justify],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

const COLUMNS = {
  /** Small numbers: 2 across on a phone, 4 on a larger screen */
  stats: "grid-cols-2 md:grid-cols-4",
  /** Bill and content cards */
  cards: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  /** People */
  people: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  /** People beside a side rail, where there's less room */
  railPeople: "grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3",
  /** Two equal columns once there's room */
  halves: "grid-cols-1 md:grid-cols-2",
};

export function Grid({
  cols = "cards",
  gap = "md",
  className,
  children,
  ...rest
}: React.ComponentProps<"div"> & { cols?: keyof typeof COLUMNS; gap?: Gap }) {
  return (
    <div className={cn("grid", COLUMNS[cols], GAP[gap], className)} {...rest}>
      {children}
    </div>
  );
}
