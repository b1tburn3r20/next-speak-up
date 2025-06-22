import { TextAnimate } from "@/components/magicui/text-animate";
import React from "react";
import RecentBillsCarousel from "./RecentBillsCarousel";
import { Legislation } from "@prisma/client";

interface CurrentlyTrackingProps {
  bills: Legislation[];
}

const CurrentlyTracking = ({ bills }: CurrentlyTrackingProps) => {
  return (
    <div className="w-full">
      <TextAnimate
        animation="blurInUp"
        by="word"
        className="text-4xl m-4 font-bold [&>span:last-child]:text-accent"
      >
        Currently Tracking
      </TextAnimate>
      <RecentBillsCarousel bills={bills} />
    </div>
  );
};

export default CurrentlyTracking;
