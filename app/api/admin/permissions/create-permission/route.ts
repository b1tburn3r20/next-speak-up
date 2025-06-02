import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { createPermission } from "@/lib/services/permissions";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  // Get data from request body
  const body = await request.json();
  const { permissionName, description } = body;

  if (!permissionName) {
    return NextResponse.json(
      { error: "permissionName is required" },
      { status: 400 }
    );
  }

  try {
    const newPermission = await createPermission(permissionName, description);

    return NextResponse.json(
      {
        success: true,
        permission: newPermission,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create permission error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
