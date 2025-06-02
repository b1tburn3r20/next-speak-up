import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { createRole } from "@/lib/services/permissions";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  // Get data from request body
  const body = await request.json();
  const { roleName, description } = body;

  if (!roleName) {
    return NextResponse.json(
      { error: "roleName is required" },
      { status: 400 }
    );
  }

  try {
    const newRole = await createRole(roleName, description);

    return NextResponse.json(
      {
        success: true,
        role: newRole,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create role error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
