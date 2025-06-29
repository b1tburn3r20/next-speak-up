// app/api/check-username/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkIfUsernameIsAvailable } from "@/lib/services/user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Trim and validate username
    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) {
      return NextResponse.json(
        { error: "Username cannot be empty" },
        { status: 400 }
      );
    }

    // Check if username exists in database
    const existingUser = await checkIfUsernameIsAvailable(trimmedUsername);

    // If existingUser is null/undefined, username is available
    // If existingUser exists, username is taken
    const isAvailable = !existingUser;

    return NextResponse.json({
      isAvailable,
      username: trimmedUsername,
    });
  } catch (error) {
    console.error("Error checking username availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
