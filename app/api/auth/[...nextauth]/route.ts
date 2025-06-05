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
            role: true, // Add this line
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
      // Fetch full user data from database including needsOnboarding
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
        },
      });

      return {
        ...session,
        user: {
          ...session.user,
          ...fullUser,
          // Ensure needsOnboarding is included and defaults to true if undefined
          needsOnboarding: fullUser?.needsOnboarding ?? true,
        },
      };
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
