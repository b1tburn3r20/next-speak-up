import React from "react";
import LandingNavbar from "../landing/navbar/navbar";
import MissionHero from "./components/MissionHero";
import { Metadata } from "next"
export const metadata: Metadata = {
  title: "Coolbills | Our mission",
  description: "Coolbills allows you to compare yourself to your representatives to see if you actually should vote for them, this mission statement goes on about what our core values are"
}
const Page = () => {
  return (
    <LandingNavbar>
      <MissionHero />
    </LandingNavbar>
  );
};

export default Page;
