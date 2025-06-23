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

const Page = async () => {
  const session = await getServerSession(authOptions);

  const [recentBills, lastViewedBill, trackedBills] = await Promise.all([
    getRecentBills(session?.user?.id, session?.user?.role?.name),
    getLastViewedBill(session?.user?.id, session?.user?.role?.name),
    getTrackedBills(session?.user?.id, session?.user?.role?.name),
  ]);

  return (
    <div className="space-y-12">
      <RecentBills bills={recentBills} />
      <div className="flex flex-col lg:flex-row gap-12 w-full">
        <div className="lg:flex-shrink-0">
          <LastViewedBill bill={lastViewedBill} />
        </div>
        <div className="lg:flex-1 lg:min-w-0">
          <CurrentlyTracking bills={trackedBills} />
        </div>
      </div>
    </div>
  );
};

export default Page;
