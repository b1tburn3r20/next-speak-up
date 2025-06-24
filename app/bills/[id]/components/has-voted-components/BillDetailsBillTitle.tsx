"use client";

import { useBillPageStore } from "../../useBillPageStore";

const BillDetailsBillTitle = () => {
  const billTitle = useBillPageStore((s) => s.billData.legislation.title);
  const isDyslexicFriendly = useBillPageStore((s) => s.isDyslexicFriendly);

  return (
    <h1
      className={`text-xl text-accent ${isDyslexicFriendly && "font-dyslexic"}`}
    >
      {billTitle}
    </h1>
  );
};

export default BillDetailsBillTitle;
