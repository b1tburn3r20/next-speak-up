import { clampText, MAX_PROMPT_CHARS, prepareChatHistory, type ChatMessage } from "@/lib/civic/bill-text-logic";
import { constructSystemPrompt } from "./prompts";

export class AiUnavailableError extends Error {}

export type BillChatInput = {
  billLabel: string;
  billText: string;
  userName: string;
  messages: ChatMessage[];
};

/**
 * Answers a question about a bill with Gemini, a paid service. Never call this in tests or
 * local checks unless the user has said to. The SDK is loaded here, not at the top of a route,
 * so a missing key means a clean "unavailable" instead of a crash.
 */
export async function answerBillQuestion(input: BillChatInput): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new AiUnavailableError("GOOGLE_API_KEY is not set");
  const history = prepareChatHistory(input.messages);
  const latest = history[history.length - 1];
  if (!latest || latest.role !== "user") throw new Error("The last message must be from the user");

  const { text, truncated } = clampText(input.billText, MAX_PROMPT_CHARS);
  const context = truncated
    ? `${text}\n\n[This bill is longer than shown here. Say so if a question may depend on the rest.]`
    : text;
  const systemPrompt = constructSystemPrompt(context, input.userName, {
    longResponses: false,
    advancedLanguage: false,
  });

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "models/gemini-2.0-flash-lite-preview-02-05",
  });
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: `I'll answer questions about ${input.billLabel}.` }] },
      ...history.slice(0, -1).map((message) => ({
        role: message.role === "user" ? "user" : "model",
        parts: [{ text: message.content }],
      })),
    ],
  });
  const result = await chat.sendMessage(latest.content);
  return result.response.text();
}

export type SpeechInput = { text: string; voice: string };

/** Turns text into speech with Lemonfox, a paid service. The same rule applies as above. */
export async function synthesizeSpeech(input: SpeechInput): Promise<ArrayBuffer> {
  const apiKey = process.env.LEMONFOX_API_KEY;
  if (!apiKey) throw new AiUnavailableError("LEMONFOX_API_KEY is not set");
  const response = await fetch("https://api.lemonfox.ai/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: input.text, voice: input.voice, response_format: "mp3" }),
  });
  if (!response.ok) throw new Error(`Speech service returned ${response.status}`);
  return response.arrayBuffer();
}
