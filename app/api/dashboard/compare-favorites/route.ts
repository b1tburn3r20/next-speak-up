//app/api/dashboard/compare-favorites/route.ts// app/api/dashboard/compare-favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { dashboardService } from "@/lib/services/dashboard";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get limit from query parameters (default to 10)
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Get dashboard data for the user
    const dashboardData = await dashboardService.getUserDashboard(userId);

    // For each favorited member, get the shared voting history
    const favoriteComparisons = await Promise.all(
      dashboardData.favoriteMembers.map(async (favorite) => {
        const sharedHistory = await dashboardService.getSharedVotingHistory(
          userId,
          favorite.member.id,
          limit
        );

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
          votingHistory: sharedHistory,
        };
      })
    );

    // Also get party alignment
    const partyAlignment = await dashboardService.getUserPartyAlignment(userId);

    // Return the comparison data
    return NextResponse.json({
      favoriteComparisons,
      partyAlignment,
      totalFavorites: dashboardData.favoriteMembers.length,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);

    // Return appropriate error response
    return NextResponse.json(
      { error: "Failed to retrieve dashboard data" },
      { status: 500 }
    );
  }
}
