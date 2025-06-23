"use client";
import {
  ArrowRight,
  CheckIcon,
  ChevronRightIcon,
  Loader,
  Loader2,
  MessageCircleQuestion,
} from "lucide-react";
import { AnimatedSubscribeButton } from "@/components/magicui/animated-subscribe-button";
import { useBillPageStore } from "../../useBillPageStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TrackBillButton() {
  const BillData = useBillPageStore((s) => s.billData);
  const [loading, setLoading] = useState(false);
  const currentTracking = BillData.userTracking.tracking;
  const setBillData = useBillPageStore((s) => s.setBillData);
  const ToggleTracking = () => {
    setLoading(true);
    updateTracking(currentTracking);
  };

  const updateTracking = async (newTrackingValue: boolean) => {
    try {
      const response = await fetch("/api/bills/tracking", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tracking: newTrackingValue,
          legislationId: BillData.legislation.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBillData(data.data);
    } catch (error) {
      console.error("Something went wrong", error);
      throw error; // Re-throw if you want calling code to handle it
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button className="bg-accent  h-10 w w-44  font-semibold hover:bg-accent cursor-wait">
        <Loader className="animate-spin" />
      </Button>
    );
  }

  return (
    <AnimatedSubscribeButton
      onClick={ToggleTracking}
      subscribeStatus={currentTracking}
      className="w-44 bg-accent"
      disabled={loading}
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
