// app/api/congress/congress-members/route.ts
import { congressService } from "@/lib/services/congress";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const query = searchParams.get("query") || "";

  try {
    const data = query
      ? await congressService.searchMembers(query, page, limit)
      : await congressService.getAllMembers(page, limit);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
