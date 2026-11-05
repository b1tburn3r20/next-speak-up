import { TextAnimate } from "@/components/magicui/text-animate";

const MissionHero = () => {
  return (
    <div>
      <TextAnimate
        animation="blurInUp"
        by="word"
        className="font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight [&>span:last-child]:text-primary"
        as="h1"
      >
        Our Mission Statement
      </TextAnimate>
      <p className="text-muted-foreground text-base sm:text-lg max-w-prose mx-auto lg:mx-0">
        Our mission is to empower the public by giving them tools to voice their opinions and create real change in our government starting with the people

      </p>{" "}
    </div>
  );
};

export default MissionHero;
