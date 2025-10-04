"use client";

import { useState } from "react";
import NavUser from "@/components/nav-user";
import NavItem from "../NavItem";
import { Session } from "next-auth";
import { X } from "lucide-react";

interface MobileNavbarProps {
  visibleNavItems: any[]; // Full nav items reconstructed from navItems data
  session: Session | null;
  userRole?: string;
  children: React.ReactNode;
}

const MobileNavbar = ({
  visibleNavItems,
  session,
  userRole,
  children,
}: MobileNavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Absolutely positioned hamburger menu button - appears on both states */}
      <button
        onClick={toggleMenu}
        className="fixed top-2 right-2 z-[60] p-2 rounded-md "
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span
            className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
              isMenuOpen ? "rotate-45 translate-y-1" : "-translate-y-0.5"
            }`}
          ></span>
          <span
            className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${
              isMenuOpen ? "opacity-0" : "opacity-100"
            }`}
          ></span>
          <span
            className={`bg-foreground block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
              isMenuOpen ? "-rotate-45 -translate-y-1" : "translate-y-0.5"
            }`}
          ></span>
        </div>
      </button>

      {/* Top bar for mobile - without hamburger button */}
      <div className="bg-background border-b border-primary p-4 flex justify-between items-center">
        <div className="font-semibold">CoolBills</div>
        {/* Empty space to maintain layout balance */}
        <div className="w-10"></div>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={toggleMenu} />
      )}

      {/* Mobile sliding menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-background border-l border-primary/50 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-primary/50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Menu</span>
            {/* Empty space since button is now absolutely positioned */}
            <div className="w-10"></div>
          </div>
        </div>

        {/* Menu content with nav items at top and user at bottom */}
        <div className="flex flex-col flex-1 justify-between min-h-0">
          <nav className="flex flex-col overflow-y-auto">
            {visibleNavItems.map((item) => (
              <div key={item.href} onClick={toggleMenu}>
                <NavItem href={item.href} />
              </div>
            ))}
          </nav>

          <div className="border-t border-primary/50 flex-shrink-0">
            <NavUser />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div>{children}</div>
      </div>
    </div>
  );
};

export default MobileNavbar;
