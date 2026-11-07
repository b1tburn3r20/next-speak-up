import Link from "next/link";
import { cn } from "@/lib/utils";

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
