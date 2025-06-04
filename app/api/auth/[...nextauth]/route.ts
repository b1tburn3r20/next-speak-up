import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma/client";
import { AgeRange, IncomeRange } from "@prisma/client";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      username: string | null;
      state: string | null;
      ageRange: AgeRange | null;
      householdIncome: IncomeRange | null;
      needsOnboarding: boolean;
      role: string | null;
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
    async jwt({ token, user }) {
      if (user) {
        const fullUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, role: true },
        });

        if (fullUser) {
          token.role = fullUser.role;
        }
      }
      return token;
    },

    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            username: true,
            state: true,
            ageRange: true,
            householdIncome: true,
          },
        });

        if (
          !existingUser ||
          !existingUser.username ||
          !existingUser.state ||
          !existingUser.ageRange ||
          !existingUser.householdIncome
        ) {
          return true;
        }
      }
      return true;
    },

    session: async ({ session, user, token }) => {
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
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
          role: true,
        },
      });

      return {
        ...session,
        user: {
          ...session.user,
          ...fullUser,
          needsOnboarding: fullUser?.needsOnboarding ?? true,
        },
      };
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
