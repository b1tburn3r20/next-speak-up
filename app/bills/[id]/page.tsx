import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import BillAskAI from "@/app/federal/bills/[billId]/components/BillAskAI";
import { getBillData, markBillAsViewed } from "@/lib/services/bills";
import { getUserPreferenceAsBoolean } from "@/lib/services/user-preferances";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import BillSummaries from "./components/BillSummaries";
import BillTitle from "./components/BillTitle";
import { SupportBillButton } from "./components/SupportBillButton";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Cache the bill data fetch to avoid duplicate calls
const getCachedBillData = cache(
  async (billId: number, userId: string | null, userRole: string | null) => {
    return await getBillData(billId, userId, userRole);
  }
);

// For metadata, we only need basic bill info, so we can create a lighter version
const getBillForMetadata = cache(async (billId: number) => {
  // You might want to create a lighter query here that only fetches title, type, number
  // For now, using the same function but could be optimized
  return await getBillData(billId, null, null);
});

// Dynamic metadata generation
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const billId = parseInt(resolvedParams.id);

  // If invalid ID, return default metadata
  if (isNaN(billId)) {
    return {
      title: "Bill Not Found",
    };
  }

  try {
    // Fetch minimal bill data for metadata
    const bill = await getBillForMetadata(billId);

    if (!bill) {
      return {
        title: "Bill Not Found",
      };
    }

    return {
      title: bill.title,
      description: `${bill.type} ${bill.number} - ${bill.title}`,
      openGraph: {
        title: bill.title,
        description: `${bill.type} ${bill.number} - ${bill.title}`,
        type: "article",
      },
    };
  } catch (error) {
    return {
      title: "Bill Details",
    };
  }
}

const Page = async ({ params }: PageProps) => {
  const session = await getServerSession(authOptions);

  // Await params before accessing properties
  const resolvedParams = await params;
  const billId = parseInt(resolvedParams.id);

  // Validate the ID
  if (isNaN(billId)) {
    redirect("/bills");
  }

  // Get the bill data using cached function
  const bill = await getCachedBillData(
    billId,
    session?.user?.id || null,
    session?.user?.role?.name || null
  );

  if (!bill) {
    return <div>Bill not found</div>;
  }

  // Get user preferences for authenticated users
  let isDyslexicFriendly = false;
  if (session?.user?.id) {
    isDyslexicFriendly = await getUserPreferenceAsBoolean(
      session.user.id,
      "dyslexic_friendly"
    );

    // Mark as viewed only for authenticated users
    await markBillAsViewed(billId, session.user.id, session.user.role.name);
  }
  const hasUser = !!session?.user?.id;
  return (
    <div className="flex justify-center items-center ">
      <div className="flex flex-col text-center items-center max-w-4xl space-y-6 bg-muted/50 rounded-xl p-4">
        <BillTitle
          billTitle={bill.title}
          isDyslexicFriendly={isDyslexicFriendly}
        />
        <div className="h-[2px] bg-muted w-full" />
        <BillSummaries
          userId={session?.user?.id}
          bill={bill}
          isDyslexicFriendly={isDyslexicFriendly}
        />
      </div>

      {hasUser && <SupportBillButton bill={bill} />}

      <BillAskAI
        congress={bill.congress}
        type={bill.type}
        number={bill.number}
        user={session}
      />
    </div>
  );
};

export default Page;
