// TrackBillButton.tsx
"use client";
import { ArrowRight, CheckIcon, BookmarkIcon, Loader2 } from "lucide-react";
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
    updateTracking(!currentTracking);
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Button
        className="w-full h-11 font-semibold"
        disabled
        variant="secondary"
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        {currentTracking ? "Untracking..." : "Tracking..."}
      </Button>
    );
  }

  return (
    <AnimatedSubscribeButton
      onClick={ToggleTracking}
      subscribeStatus={currentTracking}
      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
      disabled={loading}
    >
      <span className="group inline-flex items-center font-semibold">
        <BookmarkIcon className="mr-2 w-4 h-4" />
        Track Bill
        <ArrowRight className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
      <span className="group inline-flex items-center font-semibold">
        <CheckIcon className="mr-2 w-4 h-4" />
        Tracking
      </span>
    </AnimatedSubscribeButton>
  );
}
