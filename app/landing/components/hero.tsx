import FutureFeatureWrapper from "@/components/cb/future-feature-wrapper";
import InmostBlock from "@/components/cb/inmost-block";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <div className=" grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4">
      <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
        <TextAnimate
          animation="blurInUp"
          by="word"
          className="font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight [&>span:last-child]:text-primary"
          as="h1"
        >
          Making Goverment Easy
        </TextAnimate>
        <p className="text-muted-foreground text-base sm:text-lg max-w-prose mx-auto lg:mx-0">
          Coolbills aims to give every person access to tools they need to make their voice heard.
        </p>{" "}
        <div>
          <Link href={"/dashboard"}>
            <Button size="lg" className="w-full sm:w-auto">
              Lets Go! <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
      <InmostBlock>
        <FutureFeatureWrapper>
          <div className="w-full flex justify-center lg:justify-end min-h-50">
            <div className=" w-full max-w-md lg:max-w-none aspect-video flex justify-center items-center">
              <p>Video explaining coolbills</p>
            </div>
          </div>
        </FutureFeatureWrapper>
      </InmostBlock>
    </div>
  );
};

export default Hero;
