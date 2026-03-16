"use client";
import { Legislation } from "@prisma/client";
import BillViewCard from "./BillViewCard";
import EmptyBillCard from "./EmptyBillCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RecentBillsCarouselProps {
  bills: Legislation[];
  size?: string
}

const RecentBillsCarousel = ({ bills, size = "lg" }: RecentBillsCarouselProps) => {
  if (bills.length === 0) {
    return (
      <div className="w-full flex justify-center">
        <EmptyBillCard />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 lg:w-72 bg-linear-to-l from-background to-transparent z-10 pointer-events-none hidden sm:block" />
      <ScrollArea>
        <div className="pb-4 max-w-full overflow-y-auto flex gap-4">
          {bills.map((bill, index) => (
            <BillViewCard key={index} bill={bill} size={size} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default RecentBillsCarousel;
