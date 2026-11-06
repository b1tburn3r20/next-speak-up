import prisma from "@/prisma/client";
import { rankResults, scoreFields } from "../score";
import type { SearchProvider } from "../types";

/** Only for people with permission. The registry enforces that before this ever runs. */
export const usersProvider: SearchProvider = {
  id: "users",
  label: "Accounts",
  access: { permission: "users.search" },
  minQueryLength: 2,
  search: async ({ query, limit }) => {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { name: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 30,
      select: { id: true, username: true, name: true, email: true, role: { select: { name: true } } },
    });
    return rankResults(
      users.map((user) => ({
        id: user.id,
        title: user.username ?? user.name ?? user.email ?? "Account",
        subtitle: [user.role?.name, user.email].filter(Boolean).join(" · "),
        href: `/admin/permissions/${user.id}`,
        score: scoreFields(query, [
          { text: user.username },
          { text: user.name },
          { text: user.email, weight: 0.8 },
        ]),
      })),
      limit,
    );
  },
};
