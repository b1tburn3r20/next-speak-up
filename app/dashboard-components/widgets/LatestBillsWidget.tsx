import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import RecentBills from "@/app/bills/components/RecentBills";
import RecentBillsCarousel from "@/app/bills/components/RecentBillsCarousel";
import { TextAnimate } from "@/components/magicui/text-animate";
import { getRecentBills } from "@/lib/services/bills";
import { getServerSession } from "next-auth";


const LatestBillsWidget = async () => {
  const session = await getServerSession(authOptions);
  const bills = await getRecentBills(session?.user?.id, session?.user?.role?.name)
  return (
    <div>

      <div className="w-full">
        <TextAnimate
          animation="blurInUp"
          by="word"
          className="text-2xl mb-4 sm:mb-6 font-bold [&>span:last-child]:text-primary px-2 sm:px-0"
        >
          Most Recent bills
        </TextAnimate>
        <RecentBillsCarousel size="sm" bills={bills} />
      </div>


    </div>
  )
}

export default LatestBillsWidget
