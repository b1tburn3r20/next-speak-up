import RecentBillsCarousel from "@/app/bills/components/RecentBillsCarousel";
import { TextAnimate } from "@/components/magicui/text-animate";
import { getRecentBills } from "@/lib/services/bills";


const LatestBillsWidget = async () => {
  const bills = await getRecentBills()
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
