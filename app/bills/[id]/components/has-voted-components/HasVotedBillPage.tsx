import EmptyBillCard from "@/app/bills/components/EmptyBillCard";
import BillSummaries from "../BillSummaries";
import BillSummariesContainer from "../BillSummariesContainer";
import BillTitle from "../BillTitle";
import BillDetailsBillTitle from "./BillDetailsBillTitle";
import HasVotedBillSummariesContainer from "./HasVotedBillSummariesContainer";
import { TrackBillButton } from "./TrackBillButton";
import { UserVotedButton } from "./UserVotedButton";

// i know im treating this like a page but its pretty close i just dont need two pages for the same thing
interface HasVotedBillPageProps {
  session: any;
}

const HasVotedBillPage = ({ session }: HasVotedBillPageProps) => {
  return (
    <div className="flex gap-4">
      <div>
        <BillDetailsBillTitle />

        <HasVotedBillSummariesContainer userId={session?.user?.id} />
      </div>
      <div className="shrink-0 space-y-2">
        <EmptyBillCard
          title="Not Voted Yet"
          message="This legislation has not gone up for vote yet."
        />
        <div>
          <TrackBillButton />
          <UserVotedButton />
        </div>
      </div>
    </div>
  );
};

export default HasVotedBillPage;
