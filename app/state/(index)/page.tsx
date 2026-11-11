import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserState } from "@/lib/civic/state";
import { routes, stateRoutes } from "@/lib/routes";

/** "My state" in the nav. People in a state we cover go straight there, and everyone else picks one. */
export default async function MyStatePage() {
  const session = await getServerSession(authOptions);
  const state = session?.user?.id ? await getUserState(session.user.id) : null;
  redirect(state ? stateRoutes(state.key).home : routes.states);
}
