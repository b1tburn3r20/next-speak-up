// components/Navbar.tsx
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import NavUser from "@/components/nav-user";
import { jwtVerify } from "jose";
import { getServerSession } from "next-auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { navItems } from "../data/navbarData";
import NavToggle from "./nav-toggle";
import NavbarTop from "./navbar-top";
import NavItem from "./NavItem";

const Navbar = async ({ children }: { children: React.ReactNode }) => {
  const session = await getServerSession(authOptions);
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("user-role-token");
  // need to be careful of loops
  if (session?.user && !roleCookie) {
    // Get the current URL to redirect back to
    const headersList = await headers();
    const currentPath =
      headersList.get("x-pathname") || headersList.get("referer") || "/";
    const returnTo = encodeURIComponent(currentPath);

    redirect(`/api/cookie/set-cookie-redirect?returnTo=${returnTo}`);
  }

  // Get user's role from cookie
  let userRole: string | null = null;
  if (roleCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(roleCookie.value, secret);
      userRole = (payload.role as any)?.name || null;
    } catch (error) {
      // Cookie invalid, I handle it in middleware
    }
  }

  // Filter nav items based on user's role
  const visibleNavItems = navItems.filter((item) => {
    if (!item.requiredRoles) return true; // No role requirement means visible to all
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
          <div className="">
            <NavUser />
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <NavbarTop />
        {/* rest of my app */}
        <div className="flex-1 overflow-auto ">
          <div className="p-6 border-l-2 border-t-2 border-accent/50 rounded-tl-2xl min-h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
