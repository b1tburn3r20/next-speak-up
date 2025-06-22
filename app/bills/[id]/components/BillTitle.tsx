"use client";

import { useBillPageStore } from "../useBillPageStore";

interface BillTitleProps {
  billTitle: string;
}
const BillTitle = ({ billTitle }: BillTitleProps) => {
  const isDyslexicFriendly = useBillPageStore((s) => s.isDyslexicFriendly);

  return (
    <h1
      className={`text-center text-lg   ${
        isDyslexicFriendly && "font-dyslexic"
      }`}
    >
      {billTitle}
    </h1>
  );
};

export default BillTitle;
