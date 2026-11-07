import { redirect } from "next/navigation";

/** Writing a post happens on the forum itself now. Old links still arrive. */
export default function OldCreatePostPage() {
  redirect("/forum?compose=1");
}
