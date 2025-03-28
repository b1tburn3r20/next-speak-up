import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dashboardService } from "@/lib/services/dashboard";
import Image from "next/image";
import Link from "next/link";

// Dashboard Home Component (Server Component)
export default async function Home() {
  // Get the authenticated user session
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return (
      <div className="p-4">
        <p>Please sign in to view your dashboard.</p>
      </div>
    );
  }

  // Get dashboard data for the user
  const userId = session.user.id;
  let dashboardData;
  /// comment
  try {
    // Get favorited representatives with alignment data
    const favoriteData = await dashboardService.getUserDashboard(userId);

    // For each favorited member, get the shared voting history
    const favoriteComparisons = await Promise.all(
      favoriteData.favoriteMembers.map(async (favorite) => {
        return {
          member: {
            id: favorite.member.id,
            bioguideId: favorite.member.bioguideId,
            name: favorite.member.name,
            state: favorite.member.state,
            party: favorite.member.party,
            role: favorite.member.role,
            depiction: favorite.member.depiction,
          },
          alignment: {
            percentage: favorite.votingAlignment,
            sharedVoteCount: favorite.sharedVoteCount,
          },
        };
      })
    );

    dashboardData = { favoriteComparisons };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return (
      <div className="p-4">
        <p>Error loading representative data. Please try again later.</p>
      </div>
    );
  }

  if (!dashboardData || dashboardData.favoriteComparisons.length === 0) {
    return (
      <div className="p-4">
        <p>You haven't favorited any representatives yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {dashboardData.favoriteComparisons.map((comparison) => (
        <div key={comparison.member.id} className="mb-4 p-4 border rounded">
          <div className="flex items-center">
            {comparison.member.depiction?.imageUrl && (
              <Image
                src={comparison.member.depiction.imageUrl}
                alt={comparison.member.name}
                width={50}
                height={50}
                className="rounded-full mr-3"
              />
            )}
            <div>
              <h3 className="font-bold">{comparison.member.name}</h3>
              <p>
                Voting alignment:
                <span className="font-medium ml-1">
                  {comparison.alignment.percentage !== null
                    ? `${comparison.alignment.percentage.toFixed(1)}%`
                    : "No shared votes yet"}
                </span>
              </p>
              {comparison.alignment.sharedVoteCount > 0 && (
                <p className="text-sm text-gray-500">
                  Based on {comparison.alignment.sharedVoteCount} shared votes
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
