import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getRecentBills } from "@/lib/services/bills";
import { redirect } from "next/navigation";
import RecentBillsCarousel from "./components/RecentBillsCarousel";
import { TextAnimate } from "@/components/magicui/text-animate";

const Page = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const bills = await getRecentBills(session.user.id, session.user.role.name);

  return (
    <div>
      <TextAnimate className="text-4xl m-4 font-bold">Most Recent</TextAnimate>
      <RecentBillsCarousel bills={bills} />
    </div>
  );
};

export default Page;
