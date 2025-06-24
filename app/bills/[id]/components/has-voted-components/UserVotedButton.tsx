"use client";
import { AnimatedSubscribeButton } from "@/components/magicui/animated-subscribe-button";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckIcon, CircleCheckBig, Loader } from "lucide-react";
import { useState } from "react";
import { useBillPageStore } from "../../useBillPageStore";

export function UserVotedButton() {
  const BillData = useBillPageStore((s) => s.billData);
  const [loading, setLoading] = useState(false);
  const currentTracking = BillData.userTracking.tracking;
  const setBillData = useBillPageStore((s) => s.setBillData);
  const userDeterminedVote = BillData.userVote.votePosition;
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
      throw error;
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
      subscribeStatus={userDeterminedVote === "YEA"}
      className={`w-fit text-shadow-lg
 ${
   userDeterminedVote === "YEA"
     ? "bg-green-500 text-white text-shadow-sm"
     : "bg-red-600 text-white text-shadow-lg"
 }`}
      disabled={loading}
    >
      <span className="group inline-flex text-shadow-lg items-center">
        {" "}
        You Voted: {userDeterminedVote}
        <CircleCheckBig className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
      <span className="group inline-flex text-shadow-lg items-center">
        You Voted: {userDeterminedVote}
        <CircleCheckBig className="ml-1 size-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </AnimatedSubscribeButton>
  );
}
