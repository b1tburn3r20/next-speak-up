import { TextAnimate } from "@/components/magicui/text-animate";
import { Legislation } from "@prisma/client";
import RecentBillsCarousel from "./RecentBillsCarousel";

interface RecentBillsProps {
  bills: Legislation[];
}

const RecentBills = ({ bills }: RecentBillsProps) => {
  return (
    <div className="w-full">
      <TextAnimate
        animation="blurInUp"
        by="word"
        className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:last-child]:text-accent px-2 sm:px-0"
      >
        Most Recent
      </TextAnimate>
      <RecentBillsCarousel bills={bills} />
    </div>
  );
};

export default RecentBills;
