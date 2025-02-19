// api/congress/congress-members/vote-search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { congressVotesService } from "@/lib/services/congress_two";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract and validate required bioguideId
    const bioguideId = searchParams.get("bioguideId");
    if (!bioguideId) {
      return NextResponse.json(
        { error: "bioguideId is required" },
        { status: 400 }
      );
    }

    // Extract optional parameters
    const query = searchParams.get("query") || "";
    const tags = searchParams.getAll("tags[]") || [];
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const votePosition = searchParams.get("votePosition") || undefined;

    // Parse date parameters if present
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;
    const policyArea = searchParams.get("policyArea") || undefined;

    // Call the service with parsed parameters
    const searchResults = await congressVotesService.searchMemberVotes({
      bioguideId,
      query,
      tags,
      page,
      limit,
      votePosition,
      dateFrom,
      dateTo,
      policyArea,
    });

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Error in vote search API:", error);
    return NextResponse.json(
      { error: "Failed to search votes" },
      { status: 500 }
    );
  }
}
