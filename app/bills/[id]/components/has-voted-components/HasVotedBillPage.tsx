// HasVotedBillPage.tsx
import EmptyBillCard from "@/app/bills/components/EmptyBillCard";
import BillDetailsBillTitle from "./BillDetailsBillTitle";
import HasVotedBillSummariesContainer from "./HasVotedBillSummariesContainer";
import { TrackBillButton } from "./TrackBillButton";
import { UserVotedButton } from "./UserVotedButton";
import BillTimeline from "./BillTimeline";
import RelatedBills from "./RelatedBills";

interface HasVotedBillPageProps {
  session: any;
  noOfficialSummary: boolean;
}

const HasVotedBillPage = ({
  session,
  noOfficialSummary,
}: HasVotedBillPageProps) => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <BillDetailsBillTitle />
          <HasVotedBillSummariesContainer
            noOfficialSummary={noOfficialSummary}
            userId={session?.user?.id}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <BillTimeline />

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <div className="flex-1">
                <TrackBillButton />
              </div>
              <div className="flex-1">
                <UserVotedButton />
              </div>
            </div>
            <RelatedBills />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HasVotedBillPage;
