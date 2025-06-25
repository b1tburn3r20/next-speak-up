"use client";

import React, { useEffect, useState } from "react";
import { Legislation } from "@prisma/client";
import { BillVote } from "@/lib/services/legislation_two";
import { SupportBillButton } from "./SupportBillButton";
import { MobileSupportBillButton } from "./MobileSupportButtons";

interface ResponsiveSupportBillProps {
  bill: Legislation;
  votes?: BillVote[];
}

export function ResponsiveSupportBill({
  bill,
  votes,
}: ResponsiveSupportBillProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Render mobile version on small screens
  if (isMobile) {
    return <MobileSupportBillButton bill={bill} votes={votes} />;
  }

  // Render desktop version on larger screens
  return <SupportBillButton bill={bill} votes={votes} />;
}
