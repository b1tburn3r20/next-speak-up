import { NextRequest, NextResponse } from "next/server";
import { listDistricts } from "@/lib/civic/users";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state")?.toUpperCase();
  if (!state || !/^[A-Z]{2}$/.test(state)) {
    return NextResponse.json({ error: "Choose a state." }, { status: 400 });
  }
  return NextResponse.json(
    { districts: await listDistricts(state) },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
