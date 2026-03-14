"use client";

import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";

import { FullUserLegislationData } from "@/lib/types/bill-types";
import { useEffect, useState } from "react";
import { useBillPageStore } from "../useBillPageStore";
import BillSummariesContainer from "./BillSummariesContainer";
import BillTitle from "./BillTitle";
import DesktopSupportBillButtons from "./DesktopSupportBillButtons";
import HasVotedBillPage from "./has-voted-components/HasVotedBillPage";
import MobileSupportBillButtons from "./MobileSupportBillButtons";
import BillTimeline from "./BillTimeline/BillTimeline";

interface RenderBillProps {
  bill: FullUserLegislationData;
  session: any;
  isDyslexicFriendly: boolean;
  ttsVoicePreference?: string;
}

const RenderBill = ({
  bill,
  session,
  isDyslexicFriendly,
  ttsVoicePreference,
}: RenderBillProps) => {
  const billData = useBillPageStore((f) => f.billData);
  const setBillData = useBillPageStore((s) => s.setBillData);
  const setIsDyslexicFriendly = useBillPageStore(
    (e) => e.setIsDyslexicFriendly
  );
  const setTTSVoicePreference = useBillPageStore(
    (f) => f.setTTSVoicePreferance
  );
  const resetBillState = useBillPageStore((f) => f.resetBillState);
  const hasUser = session?.user?.id;
  const hasVoted = !!billData?.userVote;

  const [hasOfficialSummary, setHasOfficialSummary] = useState(false)


  useEffect(() => {
    resetBillState();
    setBillData(bill);
    setIsDyslexicFriendly(isDyslexicFriendly);
    setTTSVoicePreference(ttsVoicePreference);
    if (billData?.legislation?.summaries) {
      setHasOfficialSummary(true)
    }
    console.log("Heres the bill data", bill)
  }, [billData]);



  if (hasVoted) {
    return (
      <HasVotedBillPage
        noOfficialSummary={!hasOfficialSummary}
        session={session}
      />
    );
  }
  if (!billData) {
    return (
      <div className="min-h-[80vh] w-full flex justify-center items-center">
        <LoadingCatch />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border-0 sm:border  sm:rounded-xl sm:shadow-xs overflow-hidden">
          <div className="p-0 sm:p-6 lg:p-8 space-y-2 sm:space-y-6">
            <div className="text-center px-4 py-4 sm:px-0 sm:py-0">
              <BillTitle />
            </div>
            <BillTimeline actions={bill?.legislation?.actions} />
            <div className="hidden md:block border-t border-border mx-4 sm:mx-0" />

            <div className="px-1">
              <BillSummariesContainer
                hasOfficialSummary={hasOfficialSummary}
                userId={session?.user?.id}
                summaries={billData?.legislation?.summaries}
              />
            </div>
          </div>
        </div>
        {hasUser && (
          <>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xs border-t border-border sm:hidden z-20">
              <MobileSupportBillButtons />
            </div>

            <div className="hidden sm:block">
              <DesktopSupportBillButtons />
            </div>

            <div className="h-20 sm:hidden" />
          </>
        )}
      </div>
    </div>
  );
};

export default RenderBill;
