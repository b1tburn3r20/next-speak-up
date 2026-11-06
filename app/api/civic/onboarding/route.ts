import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AGE_OPTIONS } from "@/lib/civic/onboarding-logic";
import { policyAreaByName } from "@/lib/civic/policy-areas";
import { setUserTopics } from "@/lib/civic/users";
import prisma from "@/prisma/client";

const schema = z.object({
  ageRange: z.enum(AGE_OPTIONS.map((option) => option.value) as [string, ...string[]]).optional(),
  topics: z
    .array(z.string().refine((name) => policyAreaByName(name) !== null))
    .max(40)
    .optional(),
  complete: z.boolean().optional(),
});

/** Saves each onboarding step as it's finished, so leaving partway doesn't lose anything. */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "That didn't look right. Please try again." }, { status: 400 });
  }
  const { ageRange, topics, complete } = parsed.data;
  if (topics) await setUserTopics(session.user.id, topics);
  if (ageRange || complete) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(ageRange ? { ageRange: ageRange as never } : {}),
        ...(complete ? { needsOnboarding: false } : {}),
      },
    });
  }
  return NextResponse.json({ ok: true });
}
