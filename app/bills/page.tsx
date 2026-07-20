import {
  getLastViewedBill,
  getRecentBills,
} from "@/lib/services/bills";
import LastViewedBill from "./components/LastViewedBill";
import RecentBills from "./components/RecentBills";
import SearchBills from "./components/SearchBills";
import { Metadata } from "next"
import OuterBlock from "@/components/cb/outer-block";

export const metadata: Metadata = {
  title: "Coolbills | Upcoming bills",
  description: "View recent bills and legislation"
};


const Page = async () => {


  const [recentBills, lastViewedBill,] = await Promise.all([
    getRecentBills(),
    getLastViewedBill(),
  ]);

  return (
    <div className="space-y-6 mt-6 sm:space-y-8 lg:space-y-12 px-4 sm:px-6 lg:px-8 container mx-auto">
      <SearchBills />
      <OuterBlock className="p-4">
        <RecentBills bills={recentBills} />
      </OuterBlock>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 w-full">
        <OuterBlock className="p-4">
          <div className="w-full lg:w-auto overflow-hidden lg:shrink-0">
            <LastViewedBill bill={lastViewedBill} />
          </div>
        </OuterBlock>
      </div>
    </div>
  );
};
export const dynamic = "force-dynamic";

export default Page;
