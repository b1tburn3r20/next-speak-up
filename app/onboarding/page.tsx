import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { getUserLocation, getUserTopics } from "@/lib/civic/users";
import prisma from "@/prisma/client";

export const metadata: Metadata = {
  title: "Get set up",
  description: "Three quick questions, and we'll show you who represents you.",
  robots: { index: false },
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/");
  const [user, location, topics] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { ageRange: true } }),
    getUserLocation(userId),
    getUserTopics(userId),
  ]);
  return (
    <div className="min-h-dvh bg-background">
      <OnboardingFlow
        initialAge={user?.ageRange ?? null}
        initialRegion={location?.regionCode ?? null}
        initialTopics={topics}
      />
    </div>
  );
}
