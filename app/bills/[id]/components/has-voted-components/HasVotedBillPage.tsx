import BillSummaries from "../BillSummaries";
import BillTitle from "../BillTitle";
import { TrackBillButton } from "./TrackBillButton";

// i know im treating this like a page but its pretty close i just dont need two pages for the same thing
interface HasVotedBillPageProps {
  session: any;
}

const HasVotedBillPage = ({ session }: HasVotedBillPageProps) => {
  return (
    <div className="flex gap-4">
      <div>
        <TrackBillButton />
      </div>
      <div className="flex flex-col text-center items-center max-w-4xl space-y-6 bg-muted/50 rounded-xl p-4">
        <BillTitle />
        <div className="h-[2px] bg-muted w-full" />
        <BillSummaries userId={session?.user?.id} />
      </div>
    </div>
  );
};

export default HasVotedBillPage;
