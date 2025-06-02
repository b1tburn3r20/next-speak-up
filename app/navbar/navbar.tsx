import NavUser from "@/components/nav-user";
import Link from "next/link";
import { navItems } from "../data/navbarData";
import NavToggle from "./nav-toggle";
import NavItem from "./NavItem";
const Navbar = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      {/* Make sidebar a flex column with full height */}
      <div className="nav-container w-64 flex flex-col h-full transition-all duration-300 ease-in-out">
        {/* Header - fixed height */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="nav-logo font-bold text-xl">Speakup</div>
          <NavToggle />
        </div>

        {/* Nav - takes remaining space */}
        <nav className="flex flex-col justify-between flex-1">
          <div>
            {navItems.map((item) => {
              return <NavItem key={item.href} href={item.href} />;
            })}
          </div>
          <div className="p-4">
            <NavUser />
          </div>
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
export default Navbar;
