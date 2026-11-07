import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { canAccess } from "@/lib/auth/permissions";
import { getUserLocationSafe } from "@/lib/civic/users";
import { stateByRegion } from "@/lib/civic/states";
import { getHudProgressSafe } from "@/lib/civic/xp";
import { navItems } from "../data/navbar-data";
import ClientNavbar from "./varients/client-navbar";

const Navbar = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const hud = session?.user?.id ? await getHudProgressSafe(session.user.id) : null;
  const location = session?.user?.id ? await getUserLocationSafe(session.user.id) : null;
  const visibleNavHrefs = navItems
    .filter((item) => canAccess(session, item) && (!item.inCoveredState || stateByRegion(location?.regionCode) !== null))
    .map((item) => item.href);

  return (
    <ClientNavbar
      visibleNavHrefs={visibleNavHrefs}
      session={session}
      hud={hud}
      userRole={session?.user?.role?.name}
    >
      {children}
    </ClientNavbar>
  );
};

export default Navbar;
