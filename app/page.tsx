import React from "react";
import LandingNavbar from "./landing/navbar/navbar";
import Hero from "./landing/components/Hero";
import Contact from "./landing/components/Contact";
import Features from "./landing/components/Features";
import Product from "./landing/components/Product";
import FAQ from "./landing/components/FAQ";
import Compare from "./landing/components/Compare";

const Page = () => {
  return (
    <div>
      <LandingNavbar>
        <div className="space-y-4 my-14">
          <Hero />
          <Features />
          <Compare />
          {/* <SocialProof /> */}
          <Product />
          {/* <FAQ /> */}
          <Contact />
        </div>
      </LandingNavbar>
    </div>
  );
};

export default Page;
