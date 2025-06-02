import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { checkRole } from "@/lib/services/permissions";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const roleName = searchParams.get("roleName");
  if (!roleName) {
    return NextResponse.json(
      { error: "roleName parameter is required" },
      { status: 400 }
    );
  }

  try {
    const role = await checkRole(roleName);
    return NextResponse.json(
      {
        exists: !!role,
        role: role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
