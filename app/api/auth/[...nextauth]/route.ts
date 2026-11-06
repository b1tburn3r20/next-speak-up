import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma/client";
import { AgeRange, IncomeRange, Permission } from "@prisma/client";
import { getRoleWithPermissions } from "@/lib/auth/role-cache";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      username: string | null;
      state: string | null;
      district: string | null;
      ageRange: AgeRange | null;
      householdIncome: IncomeRange | null;
      needsOnboarding: boolean;
      permissions: Permission[]
      role: any;
    } & DefaultSession["user"];
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
            state: true,
            ageRange: true,
            householdIncome: true,
            needsOnboarding: true,
            district: true,
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          },
        });

        // If user doesn't exist or is missing required fields, they need onboarding
        if (
          !existingUser ||
          !existingUser.username ||
          !existingUser.state ||
          !existingUser.ageRange ||
          !existingUser.householdIncome
        ) {
          // For new users, needsOnboarding will be set to true by default in the schema
          return true;
        }
      }
      return true;
    },

    session: async ({ session, user }) => {
      // The adapter just loaded the user's row, so only their role needs looking up.
      const account = user as typeof user & {
        id: string;
        username: string | null;
        state: string | null;
        ageRange: AgeRange | null;
        householdIncome: IncomeRange | null;
        district: number | null;
        needsOnboarding: boolean | null;
        roleId: number | null;
      };
      const role = await getRoleWithPermissions(account.roleId);
      return {
        ...session,
        user: {
          ...session.user,
          id: account.id,
          name: account.name,
          email: account.email,
          image: account.image,
          username: account.username,
          state: account.state,
          ageRange: account.ageRange,
          householdIncome: account.householdIncome,
          district: account.district,
          role,
          permissions: role?.permissions.map((item) => item.permission) ?? [],
          needsOnboarding: account.needsOnboarding ?? true,
        },
      };
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
