import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getTrackedBills } from "@/lib/services/bills";
import { getServerSession } from "next-auth";
import { Suspense } from "react";
import UserTrackedBillsClientComponent from "./UserTrackedBillsClientComponent";

// Server component that fetches data
const UserTrackedBills = async () => {
  const session = await getServerSession(authOptions);

  // Fetch tracked bills data on the server
  const trackedBills = await getTrackedBills(
    session?.user?.id,
    session?.user?.role?.name
  );

  return (
    <div>
      <Suspense fallback={<UserTrackedBillsFallback />}>
        <UserTrackedBillsClientComponent bills={trackedBills} />
      </Suspense>
    </div>
  );
};

// Fallback component for loading state
const UserTrackedBillsFallback = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
};

export default UserTrackedBills;
