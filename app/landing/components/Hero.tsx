import BlockB from "@/components/cb/block-b";
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
          Government has never been this easy.
        </TextAnimate>
        <p className="text-muted-foreground text-base sm:text-lg max-w-prose mx-auto lg:mx-0">
          Coolbills takes out the complexity of government so you can see whats happening in Washington and see how you align with your congress members.
        </p>{" "}
        <div>
          <Link href={"/dashboard"}>
            <Button size="lg" className="w-full sm:w-auto">
              Lets Go! <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
      <BlockB>
        <div className="w-full flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md lg:max-w-none aspect-video flex justify-center items-center">
            <p>Video explaining coolbills</p>
          </div>
        </div>
      </BlockB>
    </div>
  );
};

export default Hero;
