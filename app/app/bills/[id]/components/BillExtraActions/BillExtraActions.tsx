"use client";

import { useEffect, useState } from "react";
import MobileBillExtraActions from "./MobileBillExtraActions";
import DesktopBillExtraActions from "./DesktopBillExtraActions";
import { FullLegislation } from "@/lib/types/bill-types";

interface BillExtraActionsProps {
  userId: string | null;
}

const BillExtraActions = ({ userId }: BillExtraActionsProps) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  return (
    <div>
      {isMobile ? (
        <MobileBillExtraActions />
      ) : (
        <DesktopBillExtraActions userId={userId} />
      )}
    </div>
  );
};

export default BillExtraActions;
