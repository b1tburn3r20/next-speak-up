import { TextAnimate } from "@/components/magicui/text-animate";
import { Legislation } from "@prisma/client";
import RecentBillsCarousel from "./RecentBillsCarousel";

interface RecentBillsProps {
  bills: Legislation[];
}
const RecentBills = ({ bills }: RecentBillsProps) => {
  return (
    <div>
      {" "}
      <TextAnimate
        animation="blurInUp"
        by="word"
        className="text-4xl m-4 font-bold [&>span:last-child]:text-accent"
      >
        Most Recent
      </TextAnimate>{" "}
      <RecentBillsCarousel bills={bills} />
    </div>
  );
};

export default RecentBills;
