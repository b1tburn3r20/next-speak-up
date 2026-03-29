import {
  getLastViewedBill,
  getRecentBills,
  getTrackedBills,
} from "@/lib/services/bills";
import CurrentlyTracking from "./components/CurrentlyTracking";
import LastViewedBill from "./components/LastViewedBill";
import RecentBills from "./components/RecentBills";
import SearchBills from "./components/SearchBills";
import BlockA from "@/components/cb/block-a";

const Page = async () => {

  const [recentBills, lastViewedBill, trackedBills] = await Promise.all([
    getRecentBills(),
    getLastViewedBill(),
    getTrackedBills(),
  ]);

  return (
    <div className="space-y-6 mt-6 sm:space-y-8 lg:space-y-12 px-4 sm:px-6 lg:px-8 container mx-auto">
      <SearchBills />
      <BlockA className="p-4">
        <RecentBills bills={recentBills} />
      </BlockA>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 w-full">
        <BlockA className="p-4">
          <div className="w-full lg:w-auto overflow-hidden lg:shrink-0">
            <LastViewedBill bill={lastViewedBill} />
          </div>
        </BlockA>
        <BlockA className="p-4 min-w-0 flex-1 items-center justify-center">
          <CurrentlyTracking bills={trackedBills} />
        </BlockA>
      </div>
    </div>
  );
};
export const dynamic = "force-dynamic";

export default Page;
