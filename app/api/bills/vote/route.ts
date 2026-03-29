// app/api/bills/vote/route.ts
import { voteOnLegislation } from "@/lib/services/bill-voting";
import prisma from "@/prisma/client";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { legislationNameId, vote } = body;

    if (!legislationNameId || vote === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: legislationNameId and vote" },
        { status: 400 }
      );
    }

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

    const data = await voteOnLegislation(legislation.id, vote);

    return NextResponse.json({ data });
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
