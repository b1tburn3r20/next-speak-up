import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { policyAreaByName } from "@/lib/civic/policy-areas";
import prisma from "@/prisma/client";

const schema = z.object({
  policyArea: z.string().refine((name) => policyAreaByName(name) !== null),
  tracked: z.boolean(),
});

/** Starts or stops tracking one policy area. */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "We don't know that topic." }, { status: 400 });
  }
  const { policyArea, tracked } = parsed.data;
  const key = { userId: session.user.id, policyArea };
  if (tracked) {
    await prisma.userPolicyTopic.upsert({
      where: { userId_policyArea: key },
      update: {},
      create: key,
    });
  } else {
    await prisma.userPolicyTopic.deleteMany({ where: key });
  }
  return NextResponse.json({ ok: true });
}
