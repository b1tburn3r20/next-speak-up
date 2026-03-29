import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail, sendAutoReply } from "@/lib/emailServices";
import { getClientIP } from "../feature-suggestion/route";
import { checkRateLimit } from "@/lib/ratelimiter";

export async function POST(request: NextRequest) {






  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, message } = body;

    const ipAddress = getClientIP(request)

    const identifier = ipAddress
    if (!ipAddress) {
      return NextResponse.json(
        { error: "No identifier" },
        { status: 401 }

      )
    }

    if (!email || !message) {
      return NextResponse.json(
        { message: "Email and message are required fields." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }


    const rateLimitedResult = await checkRateLimit(
      "email",
      "unauthenticated",
      identifier
    )
    if (!rateLimitedResult.success) {
      return NextResponse.json(
        {
          error: rateLimitedResult.error || "Rate limit exceeded",
          limit: rateLimitedResult.limit,
          remaining: rateLimitedResult.remaining,
          reset: rateLimitedResult.reset
        },
        { status: 429 }
      )

    }


    const notificationResult = await sendContactEmail({
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      phone: phone || "",
      message,
    });

    const customerName = `${firstName} ${lastName}`.trim() || "there";
    const autoReplyResult = await sendAutoReply(email, customerName);

    if (notificationResult.success && autoReplyResult.success) {
      return NextResponse.json(
        {
          message:
            "Message sent successfully! You should receive a confirmation email shortly.",
        },
        { status: 200 }
      );
    } else if (notificationResult.success && !autoReplyResult.success) {
      console.error("Auto-reply failed:", autoReplyResult.error);
      return NextResponse.json(
        { message: "Message sent successfully!" },
        { status: 200 }
      );
    } else {
      console.error("Notification email failed:", notificationResult.error);
      if (!autoReplyResult.success) {
        console.error("Auto-reply also failed:", autoReplyResult.error);
      }
      return NextResponse.json(
        { message: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { message: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
