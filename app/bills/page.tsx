import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getLastViewedBill,
  getRecentBills,
  getTrackedBills,
} from "@/lib/services/bills";
import { getServerSession } from "next-auth";
import CurrentlyTracking from "./components/CurrentlyTracking";
import LastViewedBill from "./components/LastViewedBill";
import RecentBills from "./components/RecentBills";
import SearchBills from "./components/SearchBills";

const Page = async () => {
  const session = await getServerSession(authOptions);

  const [recentBills, lastViewedBill, trackedBills] = await Promise.all([
    getRecentBills(session?.user?.id, session?.user?.role?.name),
    getLastViewedBill(session?.user?.id, session?.user?.role?.name),
    getTrackedBills(session?.user?.id, session?.user?.role?.name),
  ]);

  return (
    <div className="space-y-6 mt-6 sm:space-y-8 lg:space-y-12 px-4 sm:px-6 lg:px-8">
      <SearchBills />
      <div className="w-full overflow-hidden">
        <RecentBills bills={recentBills} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 w-full">
        <div className="w-full lg:w-auto overflow-hidden lg:flex-shrink-0">
          <LastViewedBill bill={lastViewedBill} />
        </div>
        <div className="w-full overflow-hidden lg:flex-1 lg:min-w-0">
          <CurrentlyTracking bills={trackedBills} />
        </div>
      </div>
    </div>
  );
};
export const dynamic = "force-dynamic";

export default Page;
