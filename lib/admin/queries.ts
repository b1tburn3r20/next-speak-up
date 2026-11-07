// Queries behind the admin panel. Every page that uses these checks a permission first.
import type { Prisma } from "@prisma/client";
import prisma from "@/prisma/client";
import { LOCKOUT_PERMISSIONS } from "@/lib/auth/role-rules";
import { getHudProgress } from "@/lib/civic/xp";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getOverview(now = new Date()) {
  const week = new Date(now.getTime() - 7 * DAY_MS);
  const fortnight = new Date(now.getTime() - 13 * DAY_MS);
  fortnight.setUTCHours(0, 0, 0, 0);
  const [users, newUsers, votes, votesThisWeek, activeRows, bills, people, openBugs, openIdeas, joined] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.userBillVote.count(),
    prisma.userBillVote.count({ where: { createdAt: { gte: week } } }),
    prisma.userBillVote.findMany({ where: { createdAt: { gte: week } }, distinct: ["userId"], select: { userId: true } }),
    prisma.bill.count(),
    prisma.person.count(),
    prisma.bugReport.count({ where: { resolvedAt: null } }),
    prisma.featureSuggestion.count({ where: { resolvedAt: null } }),
    prisma.user.findMany({ where: { createdAt: { gte: fortnight } }, select: { createdAt: true } }),
  ]);
  const signups = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(fortnight.getTime() + index * DAY_MS).toISOString().slice(0, 10);
    return { day, count: joined.filter((user) => user.createdAt.toISOString().slice(0, 10) === day).length };
  });
  return { users, newUsers, votes, votesThisWeek, activeUsers: activeRows.length, bills, people, openBugs, openIdeas, signups };
}

const PAGE_SIZE = 25;

export async function listUsers(options: { q?: string; roleId?: number; page?: number }) {
  const page = Math.max(1, options.page ?? 1);
  const q = options.q?.trim();
  const where: Prisma.UserWhereInput = {
    ...(options.roleId ? { roleId: options.roleId } : {}),
    ...(q ? { OR: [{ username: { contains: q } }, { email: { contains: q } }, { name: { contains: q } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        createdAt: true,
        roleId: true,
        role: { select: { name: true } },
        _count: { select: { billVotes: true } },
      },
    }),
  ]);
  return { total, page, pageSize: PAGE_SIZE, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), rows };
}

export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      state: true,
      district: true,
      roleId: true,
      leaderboardOptIn: true,
      leaderboardHiddenAt: true,
      role: { select: { name: true, permissions: { select: { permission: { select: { name: true } } } } } },
      profile: { select: { about: true, isPublic: true } },
      _count: { select: { billVotes: true, forumPosts: true, forumComments: true, civicActions: true } },
    },
  });
  if (!user) return null;
  const [progress, lastVote, audit] = await Promise.all([
    getHudProgress(user.id),
    prisma.userBillVote.findFirst({ where: { userId: id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.adminAuditLog.findMany({ where: { target: id }, orderBy: { id: "desc" }, take: 10 }),
  ]);
  return { user, progress, lastVote: lastVote?.createdAt ?? null, audit };
}

export async function listRolesWithPermissions() {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { users: true } },
        permissions: { select: { permissionId: true } },
      },
    }),
    prisma.permission.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true },
    }),
  ]);
  return {
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      users: role._count.users,
      permissionIds: role.permissions.map((item) => item.permissionId),
    })),
    permissions,
  };
}

/** The names a role grants. */
export async function rolePermissionNames(roleId: number): Promise<string[]> {
  const rows = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permission: { select: { name: true } } },
  });
  return rows.map((row) => row.permission.name);
}

/** How many people hold a permission, optionally leaving out one role or one person. */
export async function countHolders(permissionName: string, except: { roleId?: number; userId?: string } = {}): Promise<number> {
  return prisma.user.count({
    where: {
      ...(except.userId ? { id: { not: except.userId } } : {}),
      role: {
        permissions: { some: { permission: { name: permissionName } } },
        ...(except.roleId ? { id: { not: except.roleId } } : {}),
      },
    },
  });
}

export async function lockoutHolders(exceptUserId: string): Promise<Record<string, number>> {
  const entries = await Promise.all(
    LOCKOUT_PERMISSIONS.map(async (name) => [name, await countHolders(name, { userId: exceptUserId })] as const),
  );
  return Object.fromEntries(entries);
}

export async function listFeedback(showResolved: boolean) {
  const where = showResolved ? {} : { resolvedAt: null };
  const author = { select: { username: true, id: true } };
  const [bugs, ideas] = await Promise.all([
    prisma.bugReport.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { user: author } }),
    prisma.featureSuggestion.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { user: author } }),
  ]);
  return { bugs, ideas };
}

export async function listAudit(options: { action?: string; page?: number }) {
  const page = Math.max(1, options.page ?? 1);
  const where = options.action ? { action: options.action } : {};
  const [total, rows, actions] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({ where, orderBy: { id: "desc" }, skip: (page - 1) * 50, take: 50 }),
    prisma.adminAuditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);
  return { total, page, pages: Math.max(1, Math.ceil(total / 50)), rows, actions: actions.map((row) => row.action) };
}

export async function listModeration() {
  const [hidden, onBoard, abouts] = await Promise.all([
    prisma.user.findMany({
      where: { leaderboardHiddenAt: { not: null } },
      orderBy: { leaderboardHiddenAt: "desc" },
      take: 100,
      select: { id: true, username: true, leaderboardHiddenAt: true },
    }),
    prisma.user.count({ where: { leaderboardOptIn: true, leaderboardHiddenAt: null } }),
    prisma.userProfile.findMany({
      where: { about: { not: null }, isPublic: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { about: true, updatedAt: true, user: { select: { id: true, username: true } } },
    }),
  ]);
  return { hidden, onBoard, abouts };
}
