"use client";

import CurrentlyTracking from "../../bills/components/CurrentlyTracking";
import { useState } from "react";

interface UserTrackedBillsClientComponentProps {
  bills: any[];
}

const UserTrackedBillsClientComponent = ({
  bills,
}: UserTrackedBillsClientComponentProps) => {
  const [expandedBills, setExpandedBills] = useState<Set<string>>(new Set());

  const toggleExpanded = (billId: string) => {
    setExpandedBills((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(billId)) {
        newSet.delete(billId);
      } else {
        newSet.add(billId);
      }
      return newSet;
    });
  };

  if (!bills || bills.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No tracked bills found.</p>
      </div>
    );
  }

  return (
    <div className="w-full lg:flex-1 lg:min-w-0">
      <CurrentlyTracking bills={bills} />
    </div>
  );
};

export default UserTrackedBillsClientComponent;
