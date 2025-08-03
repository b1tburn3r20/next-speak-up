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
        className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:last-child]:text-primary px-2 sm:px-0"
      >
        Currently Tracking
      </TextAnimate>
      <RecentBillsCarousel bills={bills} />
    </div>
  );
};

export default CurrentlyTracking;
