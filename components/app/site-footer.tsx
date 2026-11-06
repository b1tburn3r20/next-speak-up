import Link from "next/link";
import { routes } from "@/lib/routes";

const LINKS = [
  { href: routes.federal.upcoming, label: "Upcoming votes" },
  { href: routes.federal.topics, label: "Topics" },
  { href: "/learn", label: "Learn the lingo" },
  { href: "/mission", label: "Mission" },
  { href: "/privacy", label: "Privacy" },
  { href: "/feedback", label: "Feedback" },
];

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t px-4 pb-24 pt-6 text-sm text-muted-foreground md:pb-6" data-testid="site-footer">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="underline-offset-2 hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs">
          Data from Congress.gov, the House Clerk, docs.house.gov, and Voteview. Coolbills isn&apos;t
          part of the U.S. government.
        </p>
      </div>
    </footer>
  );
}
