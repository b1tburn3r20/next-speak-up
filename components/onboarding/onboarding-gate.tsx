"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { routes } from "@/lib/routes";

// Pages someone can read before setting anything up.
const OPEN_PATHS = new Set(["/", "/mission", "/privacy", routes.onboarding]);

/** Sends a newly signed-in person to onboarding. They can skip it, and it won't ask again. */
export function OnboardingGate() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const needsOnboarding = Boolean(session?.user?.needsOnboarding);

  useEffect(() => {
    if (needsOnboarding && !OPEN_PATHS.has(pathname)) router.replace(routes.onboarding);
  }, [needsOnboarding, pathname, router]);

  return null;
}
