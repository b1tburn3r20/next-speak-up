import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { changeUserRole, userHasPermission } from "@/lib/services/permissions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  const body = await request.json();
  const { userId, roleId } = body;
  if (!userId || !roleId) {
    return NextResponse.json(
      { error: "Must provide both userid and roleid" },
      { status: 400 }
    );
  }

  try {
    const userData = await changeUserRole(
      userId,
      roleId,
      session.user.id,
      session.user.role.name
    );
    return NextResponse.json(
      {
        user: userData,
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
