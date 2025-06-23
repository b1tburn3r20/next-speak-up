import {
  updateBillTracking,
  voteOnLegislation,
} from "@/lib/services/bill-voting";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PATCH(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { legislationId, tracking } = body;

    if (!legislationId || tracking === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: legislationNameId and tracking" },
        { status: 400 }
      );
    }

    // Record the vote
    const data = await updateBillTracking(
      session.user.id,
      legislationId,
      tracking,
      session?.user?.role?.name
    );

    // Return success response with the vote
    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.error("Error recording vote:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to record vote",
      },
      { status: 500 }
    );
  }
}
