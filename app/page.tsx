import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import { headers } from "next/headers";
import { TextAnimate } from "@/components/magicui/text-animate";
import { UserActivityChart } from "./dashboard-components/UserActivityChart";

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
    <div className="container mx-auto p-4 space-y-8">
      <TextAnimate className="text-4xl m-4 font-bold [&>span:first-child]:text-primary">
        {session?.user?.id ? `Hello, ${session.user.name}` : "Hi there."}
      </TextAnimate>

      {/* Activity Chart */}
      <div className="grid gap-8 md:grid-cols-2">
        <UserActivityChart
          favoriteActions={metrics.favoriteActions}
          // totalActions={metrics.totalActions}
        />
        {/* Original List View - Optional */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Action Breakdown</h2>
          <div className="space-y-2">
            {metrics.favoriteActions.map((action, i) => (
              <div
                key={action.action}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <span className="font-medium">
                  {i + 1}. {action.action}
                </span>
                <span className="text-muted-foreground">
                  {action.count} times
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
