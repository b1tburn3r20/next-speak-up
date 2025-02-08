import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma/client";
import { AgeRange, IncomeRange } from "@prisma/client";

// Extend the built-in session types
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
    session: async ({ session, user }) => {
      // Fetch full user data from database
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
        },
      });

      return {
        ...session,
        user: {
          ...session.user,
          ...fullUser,
        },
      };
    },
  },
  // pages: {
  //     signIn: '/login'
  // }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
