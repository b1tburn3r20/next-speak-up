import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { getRoleData } from "@/lib/services/permissions";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized request", { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const roleId = searchParams.get("roleId");
  if (!roleId) {
    return NextResponse.json(
      { error: "Need to provide an id for this lookup" },
      { status: 401 }
    );
  }
  try {
    const role = await getRoleData(Number(roleId));
    return NextResponse.json(
      {
        role: role,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
