import prisma from "@/prisma/client";

// A role's permissions are read on every request and almost never change. A removed permission
// stops working within this long.
const TTL_MS = 60 * 1000;
const cached = new Map<number, { at: number; role: Awaited<ReturnType<typeof load>> }>();

function load(roleId: number) {
  return prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } },
  });
}

export async function getRoleWithPermissions(roleId: number | null) {
  if (roleId === null) return null;
  const hit = cached.get(roleId);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.role;
  const role = await load(roleId);
  cached.set(roleId, { at: Date.now(), role });
  return role;
}

/** Call after changing a role, so the change applies right away on this server. */
export function forgetRole(roleId: number) {
  cached.delete(roleId);
}
