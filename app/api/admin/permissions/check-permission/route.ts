import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { checkPermission } from "@/lib/services/permissions";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const permissionName = searchParams.get("permissionName");
  if (!permissionName) {
    return NextResponse.json(
      { error: "permissionName parameter is required" },
      { status: 400 }
    );
  }

  try {
    const permission = await checkPermission(permissionName);
    return NextResponse.json(
      {
        exists: !!permission,
        permission: permission,
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
