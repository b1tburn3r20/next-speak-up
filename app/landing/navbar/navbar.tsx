import React from "react";
import LandingDesktopNavbar from "./LandingDesktopNavbar";
import LandingMobileNavbar from "./LandingMobileNavbar";

const LandingNavbar = ({ children }) => {
  return (
    <>
      {/* Desktop Navbar - hidden on mobile */}
      <div className="hidden md:block">
        <LandingDesktopNavbar />
      </div>

      {/* Mobile Navbar - hidden on desktop */}
      <div className="block md:hidden">
        <LandingMobileNavbar>{children}</LandingMobileNavbar>
      </div>

      {/* Content for desktop (mobile content is handled within LandingMobileNavbar) */}
      <div className="hidden md:block">{children}</div>
    </>
  );
};

export default LandingNavbar;
