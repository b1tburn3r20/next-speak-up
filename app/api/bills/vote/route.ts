// app/api/bills/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { legislationVotesService } from "@/lib/services/legislation_two";
import { VotePosition } from "@prisma/client";
import prisma from "@/prisma/client";

export async function POST(request: NextRequest) {
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
    const { legislationNameId, vote } = body;

    if (!legislationNameId || vote === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: legislationNameId and vote" },
        { status: 400 }
      );
    }


    // Convert vote string to VotePosition enum
    let votePosition: VotePosition;
    try {
      votePosition = convertVoteToEnum(vote);
    } catch (error) {
      console.error("Vote conversion error:", error);
      return NextResponse.json(
        { error: `Invalid vote value: ${vote}` },
        { status: 400 }
      );
    }

    // Get legislation ID from name_id
    const legislation = await prisma.legislation.findUnique({
      where: { name_id: legislationNameId },
      select: { id: true },
    });

    if (!legislation) {
      return NextResponse.json(
        { error: `Legislation with name_id ${legislationNameId} not found` },
        { status: 404 }
      );
    }

    // Record the vote
    const userVote = await legislationVotesService.voteOnLegislation(
      session.user.id,
      legislation.id,
      votePosition
    );

    // Return success response with the vote
    return NextResponse.json({
      success: true,
      vote: userVote,
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

export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse URL for query parameters
    const url = new URL(request.url);
    const legislationNameId = url.searchParams.get("legislationNameId");

    if (!legislationNameId) {
      return NextResponse.json(
        { error: "Missing required parameter: legislationNameId" },
        { status: 400 }
      );
    }

    // Get legislation ID from name_id
    const legislation = await prisma.legislation.findUnique({
      where: { name_id: legislationNameId },
      select: { id: true },
    });

    if (!legislation) {
      return NextResponse.json(
        { error: `Legislation with name_id ${legislationNameId} not found` },
        { status: 404 }
      );
    }

    // Delete the vote
    await legislationVotesService.deleteUserLegislationVote(
      session.user.id,
      legislation.id
    );

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vote:", error);
    return NextResponse.json(
      { error: "Failed to delete vote" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse URL for query parameters
    const url = new URL(request.url);
    const legislationNameId = url.searchParams.get("legislationNameId");

    if (!legislationNameId) {
      // Get all user votes if no specific legislation is provided
      const userVotes = await legislationVotesService.getUserVotes(
        session.user.id,
        "legislation"
      );

      return NextResponse.json({ votes: userVotes });
    }

    // Get legislation ID from name_id
    const legislation = await prisma.legislation.findUnique({
      where: { name_id: legislationNameId },
      select: { id: true },
    });

    if (!legislation) {
      return NextResponse.json(
        { error: `Legislation with name_id ${legislationNameId} not found` },
        { status: 404 }
      );
    }

    // Get user's vote for the specified legislation
    const vote = await legislationVotesService.getUserLegislationVote(
      session.user.id,
      legislation.id
    );

    return NextResponse.json({ vote });
  } catch (error) {
    console.error("Error fetching vote:", error);
    return NextResponse.json(
      { error: "Failed to fetch vote" },
      { status: 500 }
    );
  }
}

// Helper function to convert string vote to VotePosition enum
function convertVoteToEnum(vote: string): VotePosition {
  if (!vote || typeof vote !== "string") {
    throw new Error(`Invalid vote type: ${typeof vote}`);
  }

  const voteStr = vote.toString().trim().toUpperCase();

  // Direct mapping to enum values
  switch (voteStr) {
    case "YES":
    case "YEA":
    case "Y":
      return VotePosition.YEA;

    case "NO":
    case "NAY":
    case "N":
      return VotePosition.NAY;

    case "PRESENT":
    case "P":
      return VotePosition.PRESENT;

    case "NOT_VOTING":
    case "NOTVOTING":
    case "NOT VOTING":
    case "ABSENT":
      return VotePosition.NOT_VOTING;

    default:
      throw new Error(`Invalid vote position: ${vote}`);
  }
}
