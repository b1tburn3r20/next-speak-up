"use client";
import React from "react";
import { Legislation } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, TextSearch } from "lucide-react";

interface FinePrintItem {
  type: string;
  details: string;
}

const parseFinePrint = (finePrint: string): FinePrintItem[] => {
  console.log("Raw fine print:", finePrint); // Debug log

  const items: FinePrintItem[] = [];

  // Match all sections that start with ** and end with :**
  const matches = finePrint.match(/\*\*([^:]+):\*\*([^*]+)/g);
  console.log("Matches found:", matches); // Debug log

  if (matches) {
    matches.forEach((match) => {
      // Extract the type (between ** and :) and details (after **)
      const [fullMatch, type, details] =
        match.match(/\*\*([^:]+):\*\*(.+)/) || [];
      if (type && details) {
        items.push({
          type: type.trim(),
          details: details.trim(),
        });
      }
    });
  }

  console.log("Parsed items:", items); // Debug log
  return items;
};

interface AiBillFinePrintProps {
  bill: Legislation;
}

const AiBillFinePrint = ({ bill }: AiBillFinePrintProps) => {
  if (!bill.fine_print) return null;

  const finePrintItems = parseFinePrint(bill.fine_print);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-accent hover:bg-accent/70"
        >
          <TextSearch className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fine Print Details</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          <div className="space-y-2 pr-4">
            {finePrintItems.length > 0 ? (
              finePrintItems.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted/50 rounded-lg space-y-2"
                >
                  <h4 className="font-medium text-lg">{item.type}</h4>
                  <p className="text-muted-foreground">{item.details}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No fine print details available
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AiBillFinePrint;
