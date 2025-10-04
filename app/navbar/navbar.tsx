// components/Navbar.tsx (Server Component)
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { navItems } from "../data/navbarData";
import { UserSession } from "@/lib/types/user-types";
import ClientNavbar from "./varients/ClientNavbar";

const Navbar = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as UserSession)?.role.name;

  // Filter and only pass hrefs
  const visibleNavHrefs = navItems
    .filter((item) => {
      if (!item.requiredRoles) return true;
      if (!userRole) return false;
      return item.requiredRoles.includes(userRole);
    })
    .map((item) => item.href);

  return (
    <ClientNavbar
      visibleNavHrefs={visibleNavHrefs}
      session={session}
      userRole={userRole}
    >
      {children}
    </ClientNavbar>
  );
};

export default Navbar;
