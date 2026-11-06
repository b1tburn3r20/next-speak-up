import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AiUnavailableError, answerBillQuestion } from "@/lib/ai/bill-chat";
import type { ChatMessage } from "@/lib/civic/bill-text-logic";
import { getBillText } from "@/lib/civic/bills";
import { billLabel } from "@/lib/civic/labels";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const askSchema = z.object({
  slug: z.string().min(1).max(80),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

/**
 * Answers come only from the stored text of the bill, never from text the browser sends. This
 * calls a paid service, so it needs a signed-in user, and tests must stub it.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to ask about this bill." }, { status: 401 });
  }
  const limit = await checkRateLimit("chatbot", getUserRole(session), session.user.id);
  if (!limit.success) {
    return NextResponse.json(
      { error: "You've asked a lot of questions today. Please try again later." },
      { status: 429 },
    );
  }
  const parsed = askSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const found = await getBillText(parsed.data.slug);
  if (!found) {
    return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  }
  if (!found.text) {
    return NextResponse.json(
      { error: "We don't have this bill's text yet, so we can't answer questions about it." },
      { status: 409 },
    );
  }
  try {
    const answer = await answerBillQuestion({
      billLabel: billLabel(found.bill.billType, found.bill.number),
      billText: found.text,
      userName: session.user.username ?? session.user.name ?? "there",
      messages: parsed.data.messages as ChatMessage[],
    });
    return NextResponse.json({ content: answer });
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      return NextResponse.json({ error: "Questions aren't available right now." }, { status: 503 });
    }
    console.error("Bill question failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "We couldn't get an answer. Please try again." },
      { status: 502 },
    );
  }
}
