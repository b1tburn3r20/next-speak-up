import { TextAnimate } from "@/components/magicui/text-animate";
import React from "react";

const Page = () => {
  return (
    <div>
      <TextAnimate
        animation="blurInUp"
        by="word"
        className="text-4xl m-4 font-bold [&>span:last-child]:text-accent"
      >
        Speakup Form
      </TextAnimate>
    </div>
  );
};

export default Page;
