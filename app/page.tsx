import React from "react";
import LandingNavbar from "./landing/navbar/navbar";
import Hero from "./landing/components/Hero";
import Contact from "./landing/components/Contact";
import Features from "./landing/components/Features";
import Product from "./landing/components/Product";
import FAQ from "./landing/components/FAQ";
import Compare from "./landing/components/Compare";
import BlockA from "@/components/cb/block-a";

const Page = () => {
  return (
    <div>
      <LandingNavbar>
        <div className="space-y-4 container mx-auto">
          <BlockA className="mt-24">
            <Hero />
          </BlockA>
          {/* <Features /> */}
          {/* <Compare /> */}
          {/* <SocialProof /> */}
          {/* <Product /> */}
          {/* <FAQ /> */}
          <BlockA>
            <Contact />
          </BlockA>
        </div>
      </LandingNavbar>
    </div>
  );
};

export default Page;
