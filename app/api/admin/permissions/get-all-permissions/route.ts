import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAllPermissions } from "@/lib/services/permissions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  try {
    const permissions = await getAllPermissions();
    return NextResponse.json(
      {
        permissions: permissions,
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
