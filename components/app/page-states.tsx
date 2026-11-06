import { PageShell } from "@/components/blocks";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageContainer({ className, children }: React.ComponentProps<"div">) {
  return <PageShell className={className}>{children}</PageShell>;
}

export function Panel({ className, children, ...rest }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-2xl border-2 border-b-4 bg-card p-4 text-card-foreground sm:p-5", className)}
      {...rest}
    >
      {children}
    </section>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed bg-card p-6 text-center sm:p-8">
      <p className="text-lg font-extrabold">{title}</p>
      {children ? <p className="mt-1 text-sm text-muted-foreground">{children}</p> : null}
      {action ? (
        <Link href={action.href} className="mt-3 inline-block text-sm underline">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} />;
}

/** A placeholder shaped like the content that's loading, so the page doesn't jump. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <PageContainer aria-busy>
      <Bar className="h-8 w-48" />
      <Bar className="h-10 w-full" />
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-4">
            <Bar className="h-4 w-24" />
            <Bar className="h-5 w-full" />
            <Bar className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

export function DetailSkeleton() {
  return (
    <PageContainer aria-busy>
      <Bar className="h-6 w-32" />
      <Bar className="h-10 w-full" />
      <Bar className="h-24 w-full" />
      <Bar className="h-64 w-full" />
    </PageContainer>
  );
}

export function AsOfNote({ date, label = "Data as of" }: { date: Date | null; label?: string }) {
  if (!date) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {label}{" "}
      {date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })}
    </p>
  );
}
