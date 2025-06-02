import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { assignPermissionToRole } from "@/lib/services/permissions";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  // Get data from request body
  const body = await request.json();
  const { permissionId, roleId } = body;

  if (!permissionId || !roleId) {
    return NextResponse.json(
      { error: "permissionName or roleId is not provided" },
      { status: 400 }
    );
  }

  try {
    const updatedRole = await assignPermissionToRole(roleId, permissionId);

    return NextResponse.json(
      {
        role: updatedRole,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Update permission error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
