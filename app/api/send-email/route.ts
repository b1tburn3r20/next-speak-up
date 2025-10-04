import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail, sendAutoReply } from "@/lib/emailServices";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, message } = body;

    // Validation
    if (!email || !message) {
      return NextResponse.json(
        { message: "Email and message are required fields." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Send notification email to info@coolbills.com
    const notificationResult = await sendContactEmail({
      firstName: firstName || "",
      lastName: lastName || "",
      email,
      phone: phone || "",
      message,
    });

    // Send auto-reply to customer
    const customerName = `${firstName} ${lastName}`.trim() || "there";
    const autoReplyResult = await sendAutoReply(email, customerName);

    // Check if both emails were sent successfully
    if (notificationResult.success && autoReplyResult.success) {
      return NextResponse.json(
        {
          message:
            "Message sent successfully! You should receive a confirmation email shortly.",
        },
        { status: 200 }
      );
    } else if (notificationResult.success && !autoReplyResult.success) {
      // Main email sent but auto-reply failed - still consider it success
      console.error("Auto-reply failed:", autoReplyResult.error);
      return NextResponse.json(
        { message: "Message sent successfully!" },
        { status: 200 }
      );
    } else {
      // Main notification email failed
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
