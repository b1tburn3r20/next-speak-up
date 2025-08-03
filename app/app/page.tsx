import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import { headers } from "next/headers";
import { TextAnimate } from "@/components/magicui/text-animate";
import UserActivityChart from "./dashboard-components/UserActivityChart";
import UserTrackedBills from "./dashboard-components/UserTrackedBills/UserTrackedBills";
import UserBookmarkedForumPosts from "./dashboard-components/UserForumBookmarks/UserBookmarkedForumPosts";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let metrics;

  if (session?.user?.id) {
    metrics = await getDashboardMetrics(session.user.id);
  } else {
    const headersList = await headers();
    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const ipAddress = forwarded?.split(",")[0] || realIp || "unknown";
    metrics = await getDashboardMetrics(undefined, undefined, ipAddress);
  }

  return (
    <div className="p-4 space-y-8">
      <TextAnimate className="text-4xl m-4 font-bold [&>span:first-child]:text-primary">
        {session?.user?.id ? `Hello, ${session.user.name}` : "Hi there."}
      </TextAnimate>

      {/* Activity Chart */}
      <div className="grid gap-8 md:grid-cols-2">
        <UserActivityChart favoriteActions={metrics.favoriteActions} />
        <div className="max-w-full overflow-hidden">
          <UserTrackedBills />
        </div>
        <div className="max-w-full overflow-hidden">
          <UserBookmarkedForumPosts userId={session?.user?.id} />
        </div>
      </div>
    </div>
  );
}
