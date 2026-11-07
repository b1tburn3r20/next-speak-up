import { redirect } from "next/navigation";
import { profilePath } from "@/lib/routes";

/** Forum links point here. The profile page respects someone's privacy choices, so it's the only one. */
export default async function OldProfileRedirect({ params }: { params: Promise<{ id: string }> }) {
  redirect(profilePath((await params).id));
}
