import { TextAnimate } from "@/components/magicui/text-animate";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center px-4 py-8 lg:py-16">
      <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
        <TextAnimate
          animation="blurInUp"
          by="word"
          className="font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight [&>span:last-child]:text-primary"
          as="h1"
        >
          Bringing you closer to real change.
        </TextAnimate>
        <p className="text-muted-foreground text-base sm:text-lg max-w-prose mx-auto lg:mx-0">
          We make it easy to stay connected with what's happening in government.
          Track the bills that matter to you, see how your representatives vote,
          and let them know where you stand on the issues.
        </p>{" "}
        <div>
          <Link href={"/dashboard"}>
            <Button size="lg" className="w-full sm:w-auto">
              Take me there <ArrowRight className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
      <div className="w-full flex justify-center lg:justify-end">
        <div className="relative w-full max-w-md lg:max-w-none aspect-video">
          <iframe
            className="w-full h-full rounded-lg"
            src="https://www.youtube.com/embed/lhe286ky-9A?si=P4zvnHUc0bS9698I"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
