import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import BillAskAI from "@/app/federal/bills/[billId]/components/BillAskAI";
import { getBillData, markBillAsViewed } from "@/lib/services/bills";
import { getUserPreferenceAsBoolean } from "@/lib/services/user-preferances";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import RenderBill from "./components/RenderBill";
import { getComprehensiveBillData } from "@/lib/services/bill-voting";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Cache the bill data fetch to avoid duplicate calls
const getCachedBillData = cache(
  async (billId: number, userId: string | null, userRole: string | null) => {
    return await getComprehensiveBillData(billId, userId, userRole);
  }
);

const getBillForMetadata = cache(async (billId: number) => {
  return await getBillData(billId, null, null);
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const billId = parseInt(resolvedParams.id);

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

  const resolvedParams = await params;
  const billId = parseInt(resolvedParams.id);

  // handle missing data or url manipulation
  if (isNaN(billId)) {
    redirect("/bills");
  }

  // this might cause some issues with data like if for some reason
  // the bill gets updated and the users session is still the same
  // just something to think about
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
    <div className="">
      <RenderBill
        bill={bill}
        session={session}
        isDyslexicFriendly={isDyslexicFriendly}
      />
      <BillAskAI
        congress={bill.legislation.congress}
        type={bill.legislation.type}
        number={bill.legislation.number}
        user={session}
      />
    </div>
  );
};

export default Page;
