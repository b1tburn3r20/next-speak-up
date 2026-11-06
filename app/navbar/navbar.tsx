import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { canAccess } from "@/lib/auth/permissions";
import { navItems } from "../data/navbar-data";
import ClientNavbar from "./varients/client-navbar";

const Navbar = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const visibleNavHrefs = navItems.filter((item) => canAccess(session, item)).map((item) => item.href);

  return (
    <ClientNavbar
      visibleNavHrefs={visibleNavHrefs}
      session={session}
      userRole={session?.user?.role?.name}
    >
      {children}
    </ClientNavbar>
  );
};

export default Navbar;
