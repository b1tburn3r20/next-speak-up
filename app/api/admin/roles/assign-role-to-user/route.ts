import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { changeUserRole } from "@/lib/services/permissions";
import { recordAudit } from "@/lib/admin/audit";
import { lockoutHolders, rolePermissionNames } from "@/lib/admin/queries";
import { canChangeUserRole, refused, roleChangeLeavesSomeone } from "@/lib/auth/role-rules";
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

  const target = await prisma.user.findUnique({
    where: { id: String(userId) },
    select: { roleId: true, username: true, role: { select: { name: true } } },
  });
  if (!target) return NextResponse.json({ error: "No such user." }, { status: 404 });
  const [newRolePermissions, targetCurrentPermissions] = await Promise.all([
    rolePermissionNames(Number(roleId)),
    target.roleId ? rolePermissionNames(target.roleId) : Promise.resolve([]),
  ]);
  const actorPermissions = session.user.permissions.map((item: { name: string }) => item.name);
  const allowed = canChangeUserRole({
    actorPermissions,
    targetCurrentPermissions,
    newRolePermissions,
    isSelf: String(userId) === session.user.id,
  });
  if (refused(allowed)) return NextResponse.json({ error: allowed.reason }, { status: 403 });
  const leavesSomeone = roleChangeLeavesSomeone({
    targetCurrentPermissions,
    newRolePermissions,
    otherHolders: await lockoutHolders(String(userId)),
  });
  if (refused(leavesSomeone)) return NextResponse.json({ error: leavesSomeone.reason }, { status: 403 });

  try {
    const userData = await changeUserRole(
      userId,
      roleId,
      session.user.id,
      session.user.role.name
    );
    await recordAudit(
      session.user,
      "user.role_changed",
      String(userId),
      `${target.role?.name ?? "No role"} to ${userData.role?.name ?? "No role"}`,
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
