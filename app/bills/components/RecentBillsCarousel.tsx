import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Legislation } from "@prisma/client";
import BillViewCard from "./BillViewCard";

interface RecentBillsCarouselProps {
  bills: Legislation[];
}

const RecentBillsCarousel = ({ bills }: RecentBillsCarouselProps) => {
  if (bills.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent bills found
      </div>
    );
  }

  return (
    <div className="relative w-full px-4">
      {/* Right fade overlay to indicate carousel continues */}
      <div className="absolute right-4 top-0 bottom-0 w-72 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {bills.map((bill) => (
            <CarouselItem
              key={bill.id}
              className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <BillViewCard bill={bill} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default RecentBillsCarousel;
