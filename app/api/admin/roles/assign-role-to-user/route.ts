import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { changeUserRole, userHasPermission } from "@/lib/services/permissions";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { can } from "@/lib/auth/permissions";
import prisma from "@/prisma/client";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }
  if (!can(session, "users.manage")) {
    return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
  }

  const body = await request.json();
  const { userId, roleId } = body;
  if (!userId || !roleId) {
    return NextResponse.json(
      { error: "Must provide both userid and roleid" },
      { status: 400 }
    );
  }

  const granted = await prisma.rolePermission.findMany({
    where: { roleId: Number(roleId) },
    select: { permission: { select: { name: true } } },
  });
  const held = new Set(session.user.permissions.map((item: { name: string }) => item.name));
  if (granted.some((item) => !held.has(item.permission.name))) {
    return NextResponse.json(
      { error: "You can't give someone permissions you don't have yourself." },
      { status: 403 },
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
