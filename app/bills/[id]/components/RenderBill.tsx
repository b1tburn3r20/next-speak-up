"use client";

import { useEffect } from "react";
import { useBillPageStore } from "../useBillPageStore";
import { Legislation } from "@prisma/client";
import BillTitle from "./BillTitle";
import BillSummaries from "./BillSummaries";
import { SupportBillButton } from "./SupportBillButton";
import LoadingCatch from "@/app/GeneralComponents/Onboarding/components/LoadingCatch";
import { FullUserLegislationData } from "@/lib/types/bill-types";
import HasVotedBillPage from "./has-voted-components/HasVotedBillPage";
import BillSummariesContainer from "./BillSummariesContainer";

interface RenderBillProps {
  bill: FullUserLegislationData;
  session: any;
  isDyslexicFriendly: boolean;
}

const RenderBill = ({ bill, session, isDyslexicFriendly }: RenderBillProps) => {
  const billData = useBillPageStore((f) => f.billData);
  const setBillData = useBillPageStore((s) => s.setBillData);
  const setIsDyslexicFriendly = useBillPageStore(
    (e) => e.setIsDyslexicFriendly
  );

  useEffect(() => {
    setBillData(bill);
    setIsDyslexicFriendly(isDyslexicFriendly);
  }, []);

  const hasUser = session?.user?.id;

  if (!billData) {
    return <LoadingCatch />;
  }
  const hasVoted = !!billData?.userVote;

  if (hasVoted) {
    return <HasVotedBillPage session={session} />;
  }

  return (
    <div className="flex justify-center items-center ">
      <div className="flex flex-col text-center items-center max-w-4xl space-y-6 bg-muted/50 rounded-xl p-4">
        <BillTitle />
        <div className="h-[2px] bg-muted w-full" />
        <BillSummariesContainer userId={session?.user?.id} />
      </div>

      {hasUser && <SupportBillButton bill={billData.legislation} />}
    </div>
  );
};

export default RenderBill;
