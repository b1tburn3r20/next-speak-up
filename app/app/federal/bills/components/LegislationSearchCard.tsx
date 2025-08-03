"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Bill {
  id: string;
  number: string;
  type: string;
  title: string;
  introducedDate: string;
  congress: string;
  policy_area?: {
    name: string;
  };
  latest_action?: {
    action_date: string;
    text: string;
  };
  sponsors?: Array<{
    sponsor: {
      firstName: string;
      lastName: string;
      party: string;
      state: string;
    };
  }>;
}

interface LegislationSearchCardProps {
  bill: Bill;
  searchQuery: string;
  tags: string[];
}

const HIGHLIGHT_COLORS = [
  "bg-pink-200", // Pink
  "bg-teal-200", // Teal
  "bg-yellow-200", // Yellow
  "bg-purple-200", // Lilac
];

const LegislationSearchCard: React.FC<LegislationSearchCardProps> = ({
  bill,
  searchQuery,
  tags,
}) => {
  const formatDate = (date: string) => {
    return date ? new Date(date).toLocaleDateString() : "N/A";
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const getAllSearchTerms = () => {
    const terms = [];
    if (searchQuery?.trim()) {
      terms.push({ term: searchQuery, color: HIGHLIGHT_COLORS[0] });
    }
    tags.forEach((tag, index) => {
      if (tag?.trim()) {
        terms.push({
          term: tag,
          color: HIGHLIGHT_COLORS[(index + 1) % HIGHLIGHT_COLORS.length],
        });
      }
    });
    return terms;
  };

  const highlightText = (text: string | number | undefined) => {
    const safeText = String(text || "");
    const searchTerms = getAllSearchTerms();

    if (searchTerms.length === 0) return safeText;

    try {
      let parts: { text: string; highlightColor?: string }[] = [
        { text: safeText },
      ];

      searchTerms.forEach(({ term, color }) => {
        const escapedTerm = escapeRegExp(term);
        const regex = new RegExp(`(${escapedTerm})`, "gi");

        parts = parts.flatMap((part) => {
          if (part.highlightColor) {
            return [part];
          }

          const splitParts = part.text.split(regex);
          return splitParts.map((text) =>
            text.toLowerCase() === term.toLowerCase()
              ? { text, highlightColor: color }
              : { text }
          );
        });
      });

      return (
        <>
          {parts.map((part, i) =>
            part.highlightColor ? (
              <mark
                key={i}
                className={`${part.highlightColor} rounded-sm px-0.5`}
              >
                {part.text}
              </mark>
            ) : (
              <React.Fragment key={i}>{part.text}</React.Fragment>
            )
          )}
        </>
      );
    } catch (error) {
      console.error("Error highlighting text:", error);
      return safeText;
    }
  };

  // Construct the bill ID from congress, type, and number
  const billId = `${bill.congress}${bill.type}${bill.number}`;

  return (
    <Link href={`/federal/bills/${billId}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <h3 className="font-semibold text-lg">
                {highlightText(`${bill.number} - ${bill.type}`)}
              </h3>
              <span className="text-sm text-muted-foreground">
                Introduced: {formatDate(bill.introducedDate)}
              </span>
            </div>

            <p className="text-sm">{highlightText(bill.title)}</p>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                Policy Area:{" "}
                {highlightText(bill.policy_area?.name || "Unknown")}
              </span>
              <span>Congress: {highlightText(bill.congress)}</span>
            </div>

            {bill.latest_action && (
              <div className="text-sm">
                <span className="font-medium">Latest Action: </span>
                <span className="text-muted-foreground">
                  {formatDate(bill.latest_action.action_date)} -{" "}
                  {highlightText(bill.latest_action.text)}
                </span>
              </div>
            )}

            {bill.sponsors?.[0]?.sponsor && (
              <div className="text-sm">
                <span className="font-medium">Sponsor: </span>
                <span className="text-muted-foreground">
                  {highlightText(
                    `${bill.sponsors[0].sponsor.firstName} ${bill.sponsors[0].sponsor.lastName} (${bill.sponsors[0].sponsor.party}-${bill.sponsors[0].sponsor.state})`
                  )}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default LegislationSearchCard;
