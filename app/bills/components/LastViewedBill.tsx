import { Legislation } from "@prisma/client";
import BillViewCard from "./BillViewCard";
import { TextAnimate } from "@/components/magicui/text-animate";
import EmptyBillCard from "./EmptyBillCard";

interface LastViewedBillProps {
  bill?: Legislation;
}

const LastViewedBill = ({ bill }: LastViewedBillProps) => {
  return (
    <div className="w-full">
      <TextAnimate className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:first-child]:text-primary px-2 sm:px-0">
        Last Viewed
      </TextAnimate>
      <div className="w-full max-w-md mx-auto lg:mx-0">
        {bill ? <BillViewCard bill={bill} /> : <EmptyBillCard />}
      </div>
    </div>
  );
};

export default LastViewedBill;
