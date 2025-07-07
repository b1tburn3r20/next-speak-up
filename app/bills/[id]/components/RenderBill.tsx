"use client";

import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";

import { FullUserLegislationData } from "@/lib/types/bill-types";
import { useEffect } from "react";
import { useBillPageStore } from "../useBillPageStore";
import BillSummariesContainer from "./BillSummariesContainer";
import BillTitle from "./BillTitle";
import DesktopSupportBillButtons from "./DesktopSupportBillButtons";
import HasVotedBillPage from "./has-voted-components/HasVotedBillPage";
import MobileSupportBillButtons from "./MobileSupportBillButtons";

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
  useEffect(() => {
    resetBillState();
    setBillData(bill);
    setIsDyslexicFriendly(isDyslexicFriendly);
    setTTSVoicePreference(ttsVoicePreference);
  }, []);

  const hasUser = session?.user?.id;

  if (!billData) {
    return <LoadingCatch />;
  }
  const hasVoted = !!billData?.userVote;

  if (hasVoted) {
    return (
      <HasVotedBillPage
        noOfficialSummary={!billData?.legislation?.summaries?.length}
        session={session}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content Container */}
      <div className="container mx-auto px-0 sm:px-6 lg:px-8 py-0 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Bill Content Card */}
          <div className="bg-card border-0 sm:border  sm:rounded-xl sm:shadow-sm overflow-hidden">
            <div className="p-0 sm:p-6 lg:p-8 space-y-2 sm:space-y-6">
              {/* Bill Title Section */}
              <div className="text-center px-4 py-4 sm:px-0 sm:py-0">
                <BillTitle />
              </div>

              {/* Divider */}
              <div className="hidden md:block border-t border-border mx-4 sm:mx-0" />

              {/* Bill Summaries Section */}
              <div className="px-1">
                <BillSummariesContainer
                  noOfficialSummary={!billData?.legislation?.summaries?.length}
                  userId={session?.user?.id}
                />
              </div>
            </div>
          </div>
          {/* Support Button - Drawer on mobile, inline on desktop */}
          {hasUser && (
            <>
              {/* Mobile: Drawer trigger button */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden z-20">
                <MobileSupportBillButtons />
              </div>

              {/* Desktop: Inline button */}
              <div className="hidden sm:block">
                <DesktopSupportBillButtons />
              </div>

              {/* Spacer for fixed button on mobile */}
              <div className="h-20 sm:hidden" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenderBill;
