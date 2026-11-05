import LandingNavbar from "../landing/navbar/navbar";
import MissionHero from "./components/mission-hero";
import { Metadata } from "next"
import PageSpacer from "@/components/cb/page-space";
export const metadata: Metadata = {
  title: "Coolbills | Our mission",
  description: "Coolbills allows you to compare yourself to your representatives to see if you actually should vote for them, this mission statement goes on about what our core values are"
}
const Page = () => {
  return (
    <LandingNavbar>
      <PageSpacer>
        <MissionHero />
      </PageSpacer>
    </LandingNavbar>
  );
};

export default Page;
