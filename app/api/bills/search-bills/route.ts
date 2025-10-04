import { AuthSession } from "@/lib/types/user-types";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimiter";
import SearchBills from "@/app/bills/components/SearchBills";
import { searchLegislation } from "@/lib/services/bills/bill-searching";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userRole = session?.user?.role?.name;

    // ip
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown ip ";

    // rate limiting
    const identifier = session?.user?.id || ip;
    const rateLimitedResult = await checkRateLimit(
      "general",
      userRole,
      identifier
    );
    if (!rateLimitedResult.success) {
      return NextResponse.json({
        error: rateLimitedResult?.error || "Rate limit error",
      });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    const results = await searchLegislation(query, userId, userRole);
    return NextResponse.json(
      {
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERROR SEARCHING BILLS");
    return NextResponse.json({
      error:
        "Seems likes we had an issue completing your search. We're not sure why but we're looking into it.",
    });
  }
}
