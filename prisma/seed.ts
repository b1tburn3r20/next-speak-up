// Creates roles, test accounts, and generated activity on top of real imported data.
// Local only. All generated accounts use @coolbills.test emails.
import { PrismaClient, VotePosition } from "@prisma/client";
import bcrypt from "bcryptjs";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function assertLocalDatabase(databaseUrl: string | undefined) {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
  const host = new URL(databaseUrl).hostname.toLowerCase();
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to seed database host ${host}. Seeding is local only.`);
  }
}

// IDs are fixed because User.roleId defaults to 2, so new signups need that row to be Member.
const ROLES = [
  { id: 1, name: "Super Admin", description: "Full access" },
  { id: 2, name: "Member", description: "Default role for new accounts" },
  { id: 3, name: "Supporter", description: "Higher usage limits" },
  { id: 4, name: "Admin", description: "Manages users and content" },
];

const PERMISSIONS = [
  { name: "userPolicyAndRep", description: "See the policy and representative widgets" },
];

const TEST_USERS = [
  { username: "test_superadmin", roleId: 1, state: "TX", district: 2, needsOnboarding: false },
  { username: "test_admin", roleId: 4, state: "CA", district: 12, needsOnboarding: false },
  { username: "test_supporter", roleId: 3, state: "NY", district: 14, needsOnboarding: false },
  { username: "test_member", roleId: 2, state: "WY", district: 0, needsOnboarding: false },
  { username: "test_newuser", roleId: 2, state: null, district: null, needsOnboarding: true },
];

// Deterministic, so re-seeding produces the same data.
function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

async function main() {
  assertLocalDatabase(process.env.DATABASE_URL);
  const password = process.env.SEED_USER_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Set SEED_USER_PASSWORD (8+ characters) in .env first.");
  }
  const prisma = new PrismaClient();
  try {
    for (const role of ROLES) {
      await prisma.role.upsert({ where: { id: role.id }, update: role, create: role });
    }
    for (const permission of PERMISSIONS) {
      const created = await prisma.permission.upsert({
        where: { name: permission.name },
        update: permission,
        create: permission,
      });
      for (const roleId of [1, 3, 4]) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: created.id } },
          update: {},
          create: { roleId, permissionId: created.id },
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const us = await prisma.jurisdiction.findUnique({ where: { code: "US" } });
    const users = [];
    for (const account of TEST_USERS) {
      const { username, ...fields } = account;
      const user = await prisma.user.upsert({
        where: { username },
        update: fields,
        create: {
          username,
          name: username,
          email: `${username}@coolbills.test`,
          ...fields,
          password: { create: { passwordHash } },
        },
      });
      await prisma.userPassword.upsert({
        where: { userId: user.id },
        update: { passwordHash },
        create: { userId: user.id, passwordHash },
      });
      users.push(user);

      if (us && account.state) {
        const code = account.district === 0 ? "AL" : String(account.district);
        const district = await prisma.district.findFirst({
          where: { regionCode: account.state, code, chamber: { kind: "LOWER" } },
        });
        await prisma.userLocation.upsert({
          where: { userId_jurisdictionId: { userId: user.id, jurisdictionId: us.id } },
          update: { regionCode: account.state, districtId: district?.id ?? null },
          create: {
            userId: user.id,
            jurisdictionId: us.id,
            regionCode: account.state,
            districtId: district?.id ?? null,
            source: "MANUAL",
          },
        });
      }
    }

    const bills = await prisma.bill.findMany({
      select: { id: true },
      orderBy: { latestActionDate: "desc" },
      take: 80,
    });
    if (bills.length === 0) {
      console.warn("No bills imported yet, so votes and tracking were skipped. Run the pipeline.");
    }
    const positions: VotePosition[] = ["YEA", "YEA", "NAY", "PRESENT"];
    const active = users.filter((user) => user.username !== "test_newuser");
    for (const [userIndex, user] of active.entries()) {
      for (const [billIndex, bill] of bills.entries()) {
        const seed = userIndex * 7 + billIndex * 3;
        if (seed % 3 !== 0) continue;
        const position = pick(positions, seed);
        await prisma.userBillVote.upsert({
          where: { userId_billId: { userId: user.id, billId: bill.id } },
          update: { position },
          create: { userId: user.id, billId: bill.id, position },
        });
        await prisma.userBillFollow.upsert({
          where: { userId_billId: { userId: user.id, billId: bill.id } },
          update: { following: seed % 2 === 0, viewedAt: new Date() },
          create: {
            userId: user.id,
            billId: bill.id,
            following: seed % 2 === 0,
            viewedAt: new Date(),
          },
        });
      }
    }

    const tag = await prisma.forumTag.upsert({
      where: { name: "general" },
      update: {},
      create: { name: "general", description: "General discussion", isOfficial: true },
    });
    const existing = await prisma.forumPost.count({ where: { title: { startsWith: "[Test]" } } });
    if (existing === 0) {
      for (const [index, author] of active.entries()) {
        const post = await prisma.forumPost.create({
          data: {
            type: pick(["general", "bill_discussion", "feature_request", "bug_report"], index),
            title: `[Test] Generated discussion ${index + 1}`,
            body: "Generated test content for local development.",
            authorId: author.id,
            isPinned: index === 0,
            tags: { create: { tagId: tag.id } },
          },
        });
        const reply = await prisma.forumComment.create({
          data: {
            body: "A generated top-level reply.",
            authorId: pick(active, index + 1).id,
            postId: post.id,
          },
        });
        await prisma.forumComment.create({
          data: {
            body: "A generated nested reply.",
            authorId: pick(active, index + 2).id,
            postId: post.id,
            parentId: reply.id,
            depth: 1,
          },
        });
        await prisma.forumPostUpvote.create({
          data: { userId: pick(active, index + 1).id, postId: post.id },
        });
        await prisma.forumPostBookmark.create({
          data: { userId: pick(active, index + 2).id, postId: post.id },
        });
      }
    }

    console.log(
      `Seeded ${ROLES.length} roles, ${users.length} users, votes on ${bills.length} bills.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Only runs when executed directly, so tests can import the guard safely.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
