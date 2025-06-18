// components/Navbar.tsx
import NavUser from "@/components/nav-user";
import Link from "next/link";
import { navItems } from "../data/navbarData";
import NavToggle from "./nav-toggle";
import NavItem from "./NavItem";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import NavbarTop from "./navbar-top";

const Navbar = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("user-role-token");
  // need to be careful of loops
  if (session?.user && !roleCookie) {
    console.log(roleCookie);

    redirect("/api/cookie/set-cookie-redirect");
  }

  // Get user's role from cookie
  let userRole: string | null = null;
  if (roleCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(roleCookie.value, secret);
      userRole = (payload.role as any)?.name || null;
    } catch (error) {
      // Cookie invalid, will be handled by middleware
    }
  }

  // Filter nav items based on user's role
  const visibleNavItems = navItems.filter((item) => {
    if (!item.requiredRoles) return true; // No role requirement = visible to all
    if (!userRole) return false; // Role required but user has no role
    return item.requiredRoles.includes(userRole); // Check if user's role is in required roles
  });

  return (
    <div className="flex h-screen">
      <div className="nav-container w-64 flex flex-col h-full transition-all duration-300 ease-in-out ">
        <NavToggle />

        <nav className="flex flex-col justify-between flex-1">
          <div>
            {visibleNavItems.map((item) => {
              return <NavItem key={item.href} href={item.href} />;
            })}
          </div>
          <div className="p-4">
            <NavUser />
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Fixed top navbar */}
        <NavbarTop />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 border-l-2 border-t-2 border-accent/50 rounded-tl-2xl min-h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
