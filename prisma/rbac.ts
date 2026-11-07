// Creates the permission catalog, and gives the built-in roles their defaults. Safe to re-run: it
// only adds. Permissions someone has since removed from a role aren't touched unless the role has
// none at all, so a role that's been customized stays that way.

import type { PrismaClient } from "@prisma/client";
import { DEFAULT_ROLE_PERMISSIONS, PERMISSIONS } from "../lib/auth/permissions";

/** Roles added after launch. They need to exist everywhere, not only on a freshly seeded database. */
const ADDED_ROLES: Record<string, string> = {
  Moderator: "Keeps the community healthy",
};

export async function ensureRbac(prisma: PrismaClient) {
  for (const [name, description] of Object.entries(ADDED_ROLES)) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name, description } });
  }

  const ids = new Map<string, number>();
  // Nobody can have removed a permission that didn't exist yet, so these go to their default roles.
  const brandNew = new Set<string>();
  for (const [name, description] of Object.entries(PERMISSIONS)) {
    const existing = await prisma.permission.findUnique({ where: { name }, select: { id: true } });
    if (!existing) brandNew.add(name);
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
    const grants = hasCatalogGrant > 0 ? permissions.filter((name) => brandNew.has(name)) : permissions;
    await prisma.rolePermission.createMany({
      data: grants.map((name) => ({ roleId: role.id, permissionId: ids.get(name)! })),
      skipDuplicates: true,
    });
  }
}
