import { NextResponse } from "next/server";
import { legislationVotesService } from "@/lib/services/legislation_two";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nameId = searchParams.get("nameId");

  if (!nameId) {
    return NextResponse.json(
      { error: "Bill name ID is required" },
      { status: 400 }
    );
  }

  try {
    const votes = await legislationVotesService.getBillVotes(nameId);
    return NextResponse.json(votes);
  } catch (error) {
    console.error("Error fetching bill votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill votes" },
      { status: 500 }
    );
  }
}
