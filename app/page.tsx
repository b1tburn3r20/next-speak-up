import type { Metadata } from 'next'
import LandingNavbar from "./landing/navbar/navbar";
import Hero from "./landing/components/Hero";
import Contact from "./landing/components/Contact";
import BlockA from "@/components/cb/block-a";


export const metadata: Metadata = {
  title: 'Coolbills | Learn about who represents you',
  description: "Coolbills allows you to see your repesentative, compare your representative to see if you agree on things."
}

const Page = () => {


  return (
    <div>
      <LandingNavbar>
        <div className="space-y-4 container mx-auto">
          <BlockA className="mt-24">
            <Hero />
          </BlockA>
          <BlockA>
            <Contact />
          </BlockA>
        </div>
      </LandingNavbar>
    </div>
  );
};

export default Page;
