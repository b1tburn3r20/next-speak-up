import type { Metadata } from 'next'
import LandingNavbar from "./landing/navbar/navbar";
import Hero from "./landing/components/Hero";
import Contact from "./landing/components/Contact";
import OuterBlock from '@/components/cb/outer-block';
import LearnYourReps from './landing/components/learn-your-reps';


export const metadata: Metadata = {
  title: 'Coolbills | Learn about who represents you',
  description: "Coolbills allows you to see your repesentative, compare your representative to see if you agree on things."
}

const Page = () => {
  return (
    <div>
      <LandingNavbar>
        <div className="space-y-12 container mx-auto">
          <OuterBlock className="mt-24">
            <Hero />
          </OuterBlock>
          <LearnYourReps />
          <OuterBlock>
            <Contact />
          </OuterBlock>
        </div>
      </LandingNavbar>
    </div>
  );
};

export default Page;
