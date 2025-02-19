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
import { Eye } from "lucide-react";

const parseMarkdownBullets = (implications: string): string[] => {
  const items = implications
    .split(/\*\s+\*\*/)
    .map((section) => {
      // Remove section reference and cleanup
      const cleaned = section
        .replace(/^[^:]*:\s*/, "") // Remove "Section X:" part
        .replace(/\*\*/g, "") // Remove remaining asterisks
        .trim();
      return cleaned;
    })
    .filter(Boolean); // Remove empty strings

  // If we got at least one valid item, return the results
  return items.length > 1 ? items.slice(1) : []; // Slice to remove first empty item
};

const parseHyphenList = (implications: string): string[] => {
  return implications
    .split(/\s*-\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseHiddenImplications = (implications: string): string[] => {
  // Try markdown bullet parsing first
  const markdownResults = parseMarkdownBullets(implications);

  // If markdown parsing yielded results, use those
  if (markdownResults.length > 0) {
    return markdownResults;
  }

  // Otherwise, fall back to hyphen parsing
  const hyphenResults = parseHyphenList(implications);
  return hyphenResults;
};

interface AiBillHiddenImplicationsProps {
  bill: Legislation;
}

const AiBillHiddenImplications = ({ bill }: AiBillHiddenImplicationsProps) => {
  if (!bill.hidden_implications) return null;

  const implications = parseHiddenImplications(bill.hidden_implications);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-accent hover:bg-accent/70"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hidden Implications</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          <div className="space-y-4">
            {implications.length > 0 ? (
              implications.map((implication, index) => (
                <div key={index} className="p-4 bg-red-500/10 rounded-lg">
                  <p className="text-red-600">{implication}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No hidden implications available
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AiBillHiddenImplications;
