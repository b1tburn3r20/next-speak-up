// BillDetailsBillTitle.tsx
"use client";

import { useBillPageStore } from "../../useBillPageStore";

const BillDetailsBillTitle = () => {
  const billTitle = useBillPageStore((s) => s.billData.legislation.title);
  const isDyslexicFriendly = useBillPageStore((s) => s.isDyslexicFriendly);

  return (
    <div className="border-b border-border pb-4">
      <h1
        className={`text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight ${
          isDyslexicFriendly && "font-dyslexic"
        }`}
      >
        {billTitle}
      </h1>
    </div>
  );
};

export default BillDetailsBillTitle;
