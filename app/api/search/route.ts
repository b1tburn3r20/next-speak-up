import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { providersFor } from "@/lib/search/registry";

/** Which kinds of results this person can search for. Each is then fetched on its own. */
export async function GET() {
  const session = await getServerSession(authOptions);
  return NextResponse.json({ providers: providersFor(session) });
}
