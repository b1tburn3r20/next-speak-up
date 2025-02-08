// app/api/legislation/search/route.ts
import { NextRequest } from "next/server";
import legislationService from "@/lib/services/legislation";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? JSON.parse(tagsParam) : [];
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const searchResults = await legislationService.searchLegislation(
      query,
      tags,
      page,
      limit
    );

    return Response.json(searchResults);
  } catch (error) {
    console.error("Search error:", error);
    return Response.json(
      { message: "Error performing search" },
      { status: 500 }
    );
  }
}
