import { Legislation } from "@prisma/client";
import BillViewCard from "./BillViewCard";
import { TextAnimate } from "@/components/magicui/text-animate";
import EmptyBillCard from "./EmptyBillCard";

interface LastViewedBillProps {
  bill?: Legislation;
}

const LastViewedBill = ({ bill }: LastViewedBillProps) => {
  return (
    <div>
      <TextAnimate className="text-4xl m-4 font-bold [&>span:first-child]:text-accent">
        Last Viewed
      </TextAnimate>
      {bill ? <BillViewCard bill={bill} /> : <EmptyBillCard />}
    </div>
  );
};

export default LastViewedBill;
