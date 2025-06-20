// GET request endpoint (create as separate route file)
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { getRecentBills } from "@/lib/services/bills";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  try {
    const recentBills = await getRecentBills(
      session.user.id,
      session.user.role.name
    );

    return NextResponse.json(
      {
        bills: recentBills,
        count: recentBills.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get recent bills error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
