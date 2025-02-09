// app/api/congress/congress-members/by-state/[state]/route.ts
import { congressService } from "@/lib/services/congress";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { state: string } }
) {
  try {
    const members = await congressService.getMembersByState(params.state);
    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members by state:", error);
    return new NextResponse("Failed to fetch representatives", { status: 500 });
  }
}
