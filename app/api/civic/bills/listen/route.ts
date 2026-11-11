import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { TTSVoiceOptions } from "@/app/data/tts-voice-options";
import { AiUnavailableError, synthesizeSpeech } from "@/lib/ai/bill-chat";
import { clampText, htmlToPlainText, MAX_SPEECH_CHARS } from "@/lib/civic/bill-text-logic";
import { getBill } from "@/lib/civic/bills";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const listenSchema = z.object({
  slug: z.string().min(1).max(80),
  voice: z.string().max(40).optional(),
});

/**
 * Reads a bill's summary aloud. The text comes from the database, so this can't be used to turn
 * arbitrary text into speech at our expense. It's a paid service, and tests must stub it.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to listen to this bill." }, { status: 401 });
  }
  const limit = await checkRateLimit("tts", getUserRole(session), session.user.id);
  if (!limit.success) {
    return NextResponse.json({ error: "Please try again in a bit." }, { status: 429 });
  }
  const parsed = listenSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const bill = await getBill(parsed.data.slug);
  if (!bill) {
    return NextResponse.json({ error: "Bill not found." }, { status: 404 });
  }
  const summary = bill.summaries[0];
  if (!summary) {
    return NextResponse.json({ error: "This bill has no summary to read yet." }, { status: 409 });
  }
  const options: readonly string[] = TTSVoiceOptions;
  const voice = parsed.data.voice && options.includes(parsed.data.voice) ? parsed.data.voice : "heart";
  const { text } = clampText(htmlToPlainText(summary.text), MAX_SPEECH_CHARS);
  try {
    const audio = await synthesizeSpeech({ text, voice });
    return new NextResponse(audio, { headers: { "Content-Type": "audio/mpeg" } });
  } catch (error) {
    if (error instanceof AiUnavailableError) {
      return NextResponse.json({ error: "Listening isn't available right now." }, { status: 503 });
    }
    console.error("Read-aloud failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "We couldn't read this. Please try again." }, { status: 503 });
  }
}
