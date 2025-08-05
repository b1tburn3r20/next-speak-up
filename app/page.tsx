import React from "react";
import LandingNavbar from "./landing/navbar/navbar";
import Hero from "./landing/components/Hero";
import Contact from "./landing/components/Contact";
import Features from "./landing/components/Features";
import SocialProof from "./landing/components/SocialProof";
import Product from "./landing/components/Product";
import FAQ from "./landing/components/FAQ";

const Page = () => {
  return (
    <div>
      <LandingNavbar>
        <Hero />
        <Features />
        <SocialProof />
        <Product />
        <FAQ />
        <Contact />
      </LandingNavbar>
    </div>
  );
};

export default Page;
