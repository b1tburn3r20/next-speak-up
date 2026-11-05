// components/Navbar.tsx (Server Component)
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { navItems } from "../data/navbar-data";
import ClientNavbar from "./varients/client-navbar";

const Navbar = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role?.name;

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
