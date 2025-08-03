import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import BillAskAI from "../../federal/bills/[billId]/components/BillAskAI";
import { getComprehensiveBillData } from "@/lib/services/bill-voting";
import { getBillData, markBillAsViewed } from "@/lib/services/bills";
import {
  getSpecificUserPreferences,
  getUserPreferenceAsBoolean,
} from "@/lib/services/user-preferances";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import RenderBill from "./components/RenderBill";
import NoBillData from "./components/NoBillData";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Cache the bill data fetch to avoid duplicate calls
const getCachedBillData = cache(
  async (billId: string, userId: string | null, userRole: string | null) => {
    return await getComprehensiveBillData(billId, userId, userRole);
  }
);

const getBillForMetadata = cache(async (billId: string) => {
  return await getBillData(billId, null, null);
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const billId = resolvedParams.id;

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
  const billId = resolvedParams.id;

  // Don't redirect if it's not a number - it might be a valid name_id
  if (!billId || billId.trim() === "") {
    redirect("/bills");
  }

  // Just pass the billId as-is to the hybrid function
  const bill = await getCachedBillData(
    billId,
    session?.user?.id || null,
    session?.user?.role?.name || null
  );

  if (!bill) {
    return <NoBillData />;
  }

  // Get user preferences for authenticated users
  let isDyslexicFriendly = false;
  let ttsVoicePreference = "heart"; // Default value

  if (session?.user?.id) {
    isDyslexicFriendly = await getUserPreferenceAsBoolean(
      session.user.id,
      "dyslexic_friendly"
    );
    // Get TTS voice preference

    const cantHaveCustomTTS =
      !session?.user?.id || session?.user?.role?.name === "Member";
    if (!cantHaveCustomTTS) {
      const preferences = await getSpecificUserPreferences(session.user.id, [
        "ttsVoicePreference",
      ]);

      ttsVoicePreference = preferences.ttsVoicePreference || "heart";
    }

    // Use the bill's numeric ID for markBillAsViewed
    await markBillAsViewed(
      bill.legislation.id,
      session.user.id,
      session.user.role.name
    );
  }
  return (
    <div>
      <RenderBill
        bill={bill}
        session={session}
        isDyslexicFriendly={isDyslexicFriendly}
        ttsVoicePreference={ttsVoicePreference}
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
