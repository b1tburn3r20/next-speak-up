import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { getBillData } from "@/lib/services/bills";
import { getComprehensiveBillData } from "@/lib/services/bill-voting";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  const role = session?.user?.role?.name;

  // Get billId from URL parameters
  const { searchParams } = new URL(request.url);
  const billId = searchParams.get("billId");

  if (!billId) {
    return NextResponse.json(
      { error: "billId is not provided" },
      { status: 400 }
    );
  }

  try {
    const billData = await getComprehensiveBillData(
      parseInt(billId),
      session.user.id,
      session.user.role.name
    );

    if (!billData) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        bill: billData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get bill data error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
