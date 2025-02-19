"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Loader2 } from "lucide-react";
import { useBillState } from "../useBillState";

const BillText = ({ congress, type, number }) => {
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const billText = useBillState((state) => state.billText);
  const isBillLoading = useBillState((state) => state.isBillLoading);
  const setBillText = useBillState((state) => state.setBillText);
  const setBillLoading = useBillState((state) => state.setBillLoading);
  const setBillLoaded = useBillState((state) => state.setBillLoaded);
  const clearBill = useBillState((state) => state.clearBill);

  useEffect(() => {
    clearBill();
  }, [clearBill]);

  const fetchBillText = async () => {
    setError("");
    setBillLoading(true);

    try {
      const formattedType = type
        .toLowerCase()
        .replace(".", "")
        .replace(" ", "");
      const url = `/api/bills/text?congress=${congress}&type=${formattedType}&number=${number}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch bill text");
      }

      const data = await response.json();
      setBillText(data.text || "No text available for this bill");
      setBillLoaded(true);
    } catch (err) {
      setError("Failed to load bill text. Please try again later.");
      console.error("Error fetching bill text:", err);
      clearBill();
    } finally {
      setBillLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Bill Text</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!billText && !isBillLoading && !error && (
          <Button onClick={fetchBillText} className="w-full">
            Load Full Bill Text
          </Button>
        )}

        {isBillLoading && (
          <div className="flex items-center justify-center space-x-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading bill text...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {billText && (
          <div className="space-y-4 flex items-center flex-col">
            <div
              className={`prose max-w-none ${
                !isExpanded ? "max-h-96 overflow-hidden" : ""
              }`}
            >
              <pre className="whitespace-pre-wrap text-sm">{billText}</pre>
            </div>

            {billText.length > 500 && (
              <Button
                variant="outline"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full"
              >
                {isExpanded ? "Show Less" : "View All"}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BillText;
