import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
import { AuthSession } from "@/lib/types/user-types";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const getCachedBillData = cache(async (billId: string) => {
  return await getComprehensiveBillData(billId);
});

const getBillForMetadata = cache(async (billId: string) => {
  return await getBillData(billId);
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const billId = resolvedParams.id;
  try {
    const bill = await getBillForMetadata(billId);
    if (!bill) {
      return { title: "Bill Not Found" };
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
  } catch {
    return { title: "Bill Details" };
  }
}

const Page = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const billId = resolvedParams.id;

  if (!billId || billId.trim() === "") {
    redirect("/bills");
  }

  const session: AuthSession = await getServerSession(authOptions);

  const bill = await getCachedBillData(billId);

  if (!bill) {
    return <NoBillData />;
  }

  let isDyslexicFriendly = false;
  let ttsVoicePreference = "heart";

  if (session?.user?.id) {
    isDyslexicFriendly = await getUserPreferenceAsBoolean(
      session.user.id,
      "dyslexic_friendly"
    );

    const cantHaveCustomTTS = session?.user?.role?.name === "Member";
    if (!cantHaveCustomTTS) {
      const preferences = await getSpecificUserPreferences(session.user.id, [
        "ttsVoicePreference",
      ]);
      ttsVoicePreference = preferences.ttsVoicePreference || "heart";
    }

    await markBillAsViewed(bill.legislation.id);
  }

  return (
    <div className="flex gap-2 justify-evenly py-4">
      <RenderBill
        bill={bill}
        session={session}
        isDyslexicFriendly={isDyslexicFriendly}
        ttsVoicePreference={ttsVoicePreference}
      />
    </div>
  );
};

export default Page;
