import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { canAccess } from "@/lib/auth/permissions";
import { getNavPlacesSafe, getUserLocationSafe } from "@/lib/civic/users";
import { stateByRegion } from "@/lib/civic/states";
import { getHudProgressSafe } from "@/lib/civic/xp";
import { routes } from "@/lib/routes";
import { navItems, type NavLabels } from "../data/navbar-data";
import ClientNavbar from "./varients/client-navbar";

const Navbar = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const [hud, location] = userId ? await Promise.all([getHudProgressSafe(userId), getUserLocationSafe(userId)]) : [null, null];
  const covered = stateByRegion(location?.regionCode) !== null;
  const places = userId && covered ? await getNavPlacesSafe(userId, location?.regionCode) : { state: null, city: null };
  const visibleNavHrefs = navItems
    .filter((item) => canAccess(session, item) && (!item.inCoveredState || covered))
    .map((item) => item.href);
  // Someone's own state and city go by name, so the nav says where they are.
  const labels: NavLabels = {
    ...(places.state ? { [routes.myState]: places.state } : {}),
    ...(places.city ? { [routes.myCity]: places.city } : {}),
    ...(covered ? { [routes.states]: "All states" } : {}),
  };

  return (
    <ClientNavbar visibleNavHrefs={visibleNavHrefs} labels={labels} session={session} hud={hud} userRole={session?.user?.role?.name}>
      {children}
    </ClientNavbar>
  );
};

export default Navbar;
