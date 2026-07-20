
"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import EmptyBillCard from "@/app/bills/components/EmptyBillCard";
import { DashboardNewBill } from "@/lib/types/bill-types";
import BillCard from "./bill-card";
import Link from "next/link";

interface RecentBillsCarouselProps {
  bills: DashboardNewBill[];
  size?: "lg" | "sm" | "md"
}

const BillsCarousel = ({ bills, size = "lg" }: RecentBillsCarouselProps) => {
  if (bills.length === 0 || !bills) {
    return (
      <div className="w-full flex justify-center">
        <EmptyBillCard />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 lg:w-72 bg-linear-to-l from-background to-transparent z-10 pointer-events-none hidden sm:block" />
      <ScrollArea
        type="always"
      >
        <div className="pb-4 max-w-full overflow-y-auto flex gap-4">
          {bills?.map((bill, index) => (
            <Link key={index} href={`/bills/${bill.name_id}`} className="cursor-pointer">
              <BillCard key={index} bill={bill} />
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default BillsCarousel;
