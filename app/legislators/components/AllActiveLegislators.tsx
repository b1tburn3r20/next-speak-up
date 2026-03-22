"use client";
import { SimpleLandingPageLegislatorData } from "@/lib/types/legislator-types";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/app/stores/useAppStore";

interface AllActiveLegislatorsProps {
  legislators: SimpleLandingPageLegislatorData[];
  userId: string | null;
}

const AllActiveLegislators = ({ legislators, userId }: AllActiveLegislatorsProps) => {
  const isMobile = useAppStore((f) => f.isMobile)
  const houseLegislators = [...legislators]
    .filter((l) => !!l.district)
    .sort((a, b) => {
      const stateCompare = a.state.localeCompare(b.state);
      if (stateCompare !== 0) return stateCompare;
      return parseInt(a.district) - parseInt(b.district);
    });

  const senateLegislators = [...legislators]
    .filter((l) => !l.district)
    .sort((a, b) => a.state.localeCompare(b.state));


  return (
    <div className="p-2 py-4 md:p-8 rounded-3xl shadow-md bg-background">
      <TextAnimate className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:first-child]:text-primary">
        All Active Legislators
      </TextAnimate>
      <Accordion type="multiple" defaultValue={isMobile ? [] : ["house", "senate"]} className="flex flex-col md:flex-row gap-3">
        <AccordionItem value="house" className="rounded-2xl overflow-hidden flex-1">
          <AccordionTrigger className="border-b-2 px-6 py-4 rounded-none rounded-t-2xl bg-background-light hover:bg-muted/50 hover:no-underline">
            <span className="text-lg font-semibold">House of Representatives</span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <Table className="bg-background-light w-full">
              <TableHeader>
                <TableRow className="hover:bg-unset bg-accent h-14">
                  <TableHead className="w-14">View</TableHead>
                  <TableHead className="w-40">State</TableHead>
                  <TableHead className="md:w-80">Name</TableHead>
                  <TableHead>District</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {houseLegislators.map((l, i) => {
                  const firstName = l?.name.split(",")[1];
                  const lastName = l?.name.split(",")[0];
                  return (
                    <TableRow className={`${i % 2 === 0 ? "bg-background" : ""} hover:bg-unset`} key={i}>
                      <TableCell>
                        <Link href={`/legislators/federal/${l.bioguideId}`}>
                          <Button><ArrowRight /></Button>
                        </Link>
                      </TableCell>
                      <TableCell>{l.state}</TableCell>
                      <TableCell>{`${firstName} ${lastName}`}</TableCell>
                      <TableCell>{l.district}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="senate" className="rounded-2xl overflow-hidden flex-1">
          <AccordionTrigger className="px-6 py-4 rounded-none rounded-t-2xl bg-background-light hover:bg-muted/50 hover:no-underline">
            <span className="text-lg font-semibold">Senate</span>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <Table className="bg-background-light w-full">
              <TableHeader>
                <TableRow className="hover:bg-unset bg-accent h-14">
                  <TableHead className="w-14">View</TableHead>
                  <TableHead className="w-40">State</TableHead>
                  <TableHead className="md:w-80">Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {senateLegislators.map((l, i) => {
                  const firstName = l?.name.split(",")[1];
                  const lastName = l?.name.split(",")[0];
                  return (
                    <TableRow className={`${i % 2 !== 0 ? "bg-background" : ""} hover:bg-unset`} key={i}>
                      <TableCell>
                        <Link href={`/legislators/federal/${l.bioguideId}`}>
                          <Button><ArrowRight /></Button>
                        </Link>
                      </TableCell>
                      <TableCell>{l.state}</TableCell>
                      <TableCell>{`${firstName} ${lastName}`}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default AllActiveLegislators;
