// app/api/user/set-username/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateUserUsername } from "@/lib/services/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthSession } from "@/lib/types/user-types";
export async function POST(request: NextRequest) {
  try {
    const session: AuthSession = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) {
      return NextResponse.json(
        { error: "Username cannot be empty" },
        { status: 400 }
      );
    }

    // Update the username
    const updatedUser = await updateUserUsername(
      session.user.id,
      session.user.role.name || "User",
      trimmedUsername
    );

    return NextResponse.json({
      success: true,
      username: updatedUser.username,
    });
  } catch (error) {
    console.error("Error setting username:", error);

    if (error.message === "Username is already taken") {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
