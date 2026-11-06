// Creates the permission catalog, and gives the built-in roles their defaults. Safe to re-run: it
// only adds. Permissions someone has since removed from a role aren't touched unless the role has
// none at all, so a role that's been customized stays that way.

import type { PrismaClient } from "@prisma/client";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "../lib/auth/permissions";

export async function ensureRbac(prisma: PrismaClient) {
  const ids = new Map<string, number>();
  for (const [name, description] of Object.entries(PERMISSIONS)) {
    const permission = await prisma.permission.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
    ids.set(name, permission.id);
  }

  for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
      include: { _count: { select: { permissions: true } } },
    });
    if (!role) continue;
    const hasCatalogGrant = await prisma.rolePermission.count({
      where: { roleId: role.id, permissionId: { in: [...ids.values()] } },
    });
    if (hasCatalogGrant > 0) continue;
    await prisma.rolePermission.createMany({
      data: permissions.map((name) => ({ roleId: role.id, permissionId: ids.get(name)! })),
      skipDuplicates: true,
    });
  }
}
