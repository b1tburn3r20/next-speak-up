import LandingDesktopNavbar from "./landing-desktop-navbar";
import LandingMobileNavbar from "./landing-mobile-navbar";

const LandingNavbar = ({ children }) => {
  return (
    <>
      <div className="hidden mb-12 md:block">
        <LandingDesktopNavbar />
      </div>
      <div className="block md:hidden">
        <LandingMobileNavbar>{children}</LandingMobileNavbar>
      </div>
      <div className="hidden md:block">{children}</div>
    </>
  );
};

export default LandingNavbar;
