"use client";

import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";

import { FullUserLegislationData } from "@/lib/types/bill-types";
import { useEffect, useState } from "react";
import { useBillPageStore } from "../useBillPageStore";
import BillSummariesContainer from "./BillSummariesContainer";
import BillTitle from "./BillTitle";
import BillTimeline from "./BillTimeline/BillTimeline";
import { Separator } from "@/components/ui/separator";
import FederalLegislationVoteButtons from "./federal-legislation-vote-buttons";
import BlockB from "@/components/cb/block-b";
import YourRepVotes from "./congressional-votes/your-rep-votes";
import BillMoreInfo from "./bill-more-info";

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

  const [hasOfficialSummary, setHasOfficialSummary] = useState(false)


  useEffect(() => {
    resetBillState();
    setBillData(bill);
    setIsDyslexicFriendly(isDyslexicFriendly);
    setTTSVoicePreference(ttsVoicePreference);
    if (billData?.legislation?.summaries?.length) {
      setHasOfficialSummary(true)
    }
  }, [billData?.legislation]);

  if (!billData) {
    return (
      <div className="min-h-[80vh] w-full flex justify-center items-center">
        <LoadingCatch />
      </div>
    );
  }

  return (
    <div className="lg:w-4xl max-w-4xl mx-auto">
      <div className="border-0 bg-background shadow-md  rounded-3xl overflow-hidden">
        <div className="p-2 sm:p-6 lg:p-8 space-y-2 sm:space-y-6">
          <BlockB className="relative">
            <div className=" text-center px-4 py-4 sm:px-0 sm:py-0">

              <BillTitle />
              <div className="absolute right-0.5 top-0.5">
              </div>
            </div>
          </BlockB>
          <BlockB>
            <BillTimeline bill={bill} />
          </BlockB>
          <Separator className="my-6" />
          <BillSummariesContainer
            hasOfficialSummary={hasOfficialSummary}
            userId={session?.user?.id}
            summaries={billData?.legislation?.summaries}
          />
          <FederalLegislationVoteButtons
            session={session?.user}
          />
          <YourRepVotes userId={session?.user.id} district={session?.user?.district} state={session?.user?.state} congressionalVotes={bill?.congressionalVotes} />
        </div>
      </div>
    </div>
  );
};

export default RenderBill;
