import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { constructSystemPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, getUserRole } from "@/lib/ratelimiter";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const DEFAULT_SETTINGS = {
  longResponses: false,
  advancedLanguage: false,
  contextSize: 10,
};

export async function POST(req: Request) {
  try {
    // Get session first to determine user role
    const session = await getServerSession(authOptions);
    const userName = session?.user?.name || "User";
    const userRole = getUserRole(session);

    // Get IP address as identifier
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Use user ID if authenticated, otherwise use IP
    const identifier = session?.user?.id || ip;

    // Check rate limit with proper endpoint and role
    const rateLimitResult = await checkRateLimit(
      "chatbot",
      userRole,
      identifier
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || "Rate limit exceeded",
          isRateLimit: true,
          role: "assistant",
          content:
            rateLimitResult.error ||
            "You've exceeded the rate limit. Please try again later.",
          ...(rateLimitResult.limit && { limit: rateLimitResult.limit }),
          ...(rateLimitResult.remaining && {
            remaining: rateLimitResult.remaining,
          }),
          ...(rateLimitResult.reset && { reset: rateLimitResult.reset }),
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages, billText } = body;
    const settings = { ...DEFAULT_SETTINGS, ...(body.settings || {}) };

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Validate bill text
    if (!billText || typeof billText !== "string" || billText.trim() === "") {
      return NextResponse.json(
        {
          content:
            "I apologize, but I need the bill text to be loaded before I can answer questions about it. Please ensure the bill text is loaded and try again.",
          role: "assistant",
        },
        { status: 200 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.0-flash-lite-preview-02-05",
    });

    // Find first user message
    let startIndex = 0;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "user") {
        startIndex = i;
        break;
      }
    }

    const validMessages = messages.slice(startIndex);

    // Construct system prompt with validated settings
    const systemPrompt = constructSystemPrompt(billText, userName, settings);

    const formattedMessages = [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [
          { text: "I understand and will adjust my responses accordingly." },
        ],
      },
      ...validMessages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    ];

    const chat = model.startChat({
      history:
        formattedMessages.length > 1 ? formattedMessages.slice(0, -1) : [],
    });

    try {
      const result = await chat.sendMessage(
        validMessages[validMessages.length - 1].content
      );
      const response = await result.response;
      const text = response.text();

      return NextResponse.json({
        content: text,
        role: "assistant",
      });
    } catch (aiError: any) {
      // Handle specific AI API errors
      if (aiError?.status === 429) {
        return NextResponse.json(
          {
            error:
              "AI service rate limit exceeded. Please try again in a moment.",
            isRateLimit: true,
            role: "assistant",
            content:
              "The AI service is receiving too many requests right now. Please try again in a moment.",
          },
          { status: 429 }
        );
      }
      throw aiError; // Re-throw for general error handling
    }
  } catch (error: any) {
    console.error("AI Chat Error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate response",
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
      },
      { status: 500 }
    );
  }
}
