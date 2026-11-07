"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Only the sections someone can open. Scrolls sideways on a phone, rather than wrapping. */
export function AdminNav({ sections }: { sections: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const active =
    [...sections].sort((a, b) => b.href.length - a.href.length).find(
      ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
    )?.href ?? null;
  return (
    <nav aria-label="Admin" className="-mx-1 overflow-x-auto" data-testid="admin-nav">
      <ul className="flex w-max gap-1 p-1">
        {sections.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={href === active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 text-sm font-extrabold",
                href === active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
