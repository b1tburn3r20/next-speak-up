"use client";
import {
  ArrowRight,
  CheckIcon,
  ChevronRightIcon,
  MessageCircleQuestion,
} from "lucide-react";
import { AnimatedSubscribeButton } from "@/components/magicui/animated-subscribe-button";
import { FullLegislation } from "@/lib/types/bill-types";
import { useBillPageStore } from "../../useBillPageStore";

export function TrackBillButton() {
  const ToggleTracking = () => {
    console.log("something happened");
  };
  const BillLegislation = useBillPageStore((s) => s.billData.legislation);
  return (
    <AnimatedSubscribeButton
      onClick={ToggleTracking}
      className="w-44 bg-accent"
    >
      <span className="group inline-flex items-center">
        Track Bill
        <ArrowRight className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
      <span className="group inline-flex items-center">
        <CheckIcon className="mr-2 size-4" />
        Tracking
      </span>
    </AnimatedSubscribeButton>
  );
}
