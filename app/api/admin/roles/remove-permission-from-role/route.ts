import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { removePermissionFromRole } from "@/lib/services/permissions";
import { can } from "@/lib/auth/permissions";
import { canRevokePermission, refused } from "@/lib/auth/role-rules";
import { recordAudit } from "@/lib/admin/audit";
import { countHolders } from "@/lib/admin/queries";
import prisma from "@/prisma/client";

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }
  if (!can(session, "roles.manage")) {
    return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
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

  const permission = await prisma.permission.findUnique({ where: { id: Number(permissionId) }, select: { name: true } });
  if (!permission) return NextResponse.json({ error: "No such permission." }, { status: 404 });
  const allowed = canRevokePermission({
    actorPermissions: session.user.permissions.map((item: { name: string }) => item.name),
    permissionName: permission.name,
    holdersAfter: await countHolders(permission.name, { roleId: Number(roleId) }),
  });
  if (refused(allowed)) return NextResponse.json({ error: allowed.reason }, { status: 403 });

  try {
    const updatedRole = await removePermissionFromRole(roleId, permissionId);

    await recordAudit(session.user, "role.permission_removed", updatedRole?.name ?? String(roleId), permission.name);
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
