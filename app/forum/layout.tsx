import { notFound } from "next/navigation";
import { FORUM_OPEN } from "@/lib/features";

/** The forum is shelved for now (`FORUM_OPEN` in lib/features.ts), so every page under it is a 404. */
export default function ForumLayout({ children }: { children: React.ReactNode }) {
  if (!FORUM_OPEN) notFound();
  return <>{children}</>;
}
