"use client";

import { useState, useEffect } from "react";
import { useBillState } from "@/app/app/federal/bills/[billId]/useBillState";
import { toast } from "sonner";
import { useBillPageStore } from "../useBillPageStore";

const BillTextTab = () => {
  const billData = useBillPageStore((f) => f.billData);
  const congress = billData?.legislation?.congress;
  const type = billData?.legislation?.type;
  const number = billData?.legislation?.number;

  const isBillLoaded = useBillState((state) => state.isBillLoaded);
  const isBillLoading = useBillState((state) => state.isBillLoading);
  const billText = useBillState((state) => state.billText);
  const setBillText = useBillState((state) => state.setBillText);
  const setBillLoading = useBillState((state) => state.setBillLoading);
  const setBillLoaded = useBillState((state) => state.setBillLoaded);
  const resetBillState = useBillState((state) => state.clearBill);
  const currentBillId = useBillState((f) => f.currentBillId);
  const setCurrentBillId = useBillState((f) => f.setCurrentBillId);

  // Create a unique bill identifier
  const billId =
    congress && type && number ? `${congress}-${type}-${number}` : null;

  // Clear state and fetch bill data when bill changes (not when component mounts)
  useEffect(() => {
    const fetchBillText = async () => {
      if (!billId || isBillLoading) return;

      // If this is the same bill and it's already loaded, don't fetch again
      if (currentBillId === billId && isBillLoaded) {
        return;
      }

      // If this is a different bill, clear state first
      if (currentBillId !== billId) {
        resetBillState();
        setCurrentBillId(billId);
      }

      // If already loaded for this bill, don't fetch again
      if (isBillLoaded && currentBillId === billId) {
        return;
      }

      setBillLoading(true);
      toast.success("Loading bill text...", {
        position: "bottom-center",
      });

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
        console.error("Error fetching bill text:", err);
        toast.error("Failed to load bill text. Please try again later.");
      } finally {
        setBillLoading(false);
      }
    };

    fetchBillText();
  }, [billId, isBillLoaded, currentBillId]); // Include isBillLoaded and currentBillId in dependencies

  if (isBillLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bill text...</p>
        </div>
      </div>
    );
  }

  if (!isBillLoaded || !billText) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">No bill text available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background border rounded-lg p-6">
          <pre className="whitespace-pre-wrap font-sans font-semibold text-lg leading-relaxed">
            {billText}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default BillTextTab;
