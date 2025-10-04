// app/api/forum/lock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { lockPost, pinPost } from "@/lib/services/forum-service";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userRole = session?.user?.role?.name;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    if (userRole !== "Admin" && userRole !== "Super Admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { postId, lockStatus } = body;

    if (!postId || typeof postId !== "number") {
      return NextResponse.json(
        { error: "Post ID is required and must be a number" },
        { status: 400 }
      );
    }

    if (typeof lockStatus !== "boolean") {
      return NextResponse.json(
        { error: "Pin status is required and must be a boolean" },
        { status: 400 }
      );
    }

    try {
      const updatedPost = await lockPost(postId, lockStatus, userId, userRole);

      return NextResponse.json({
        success: true,
        message: lockStatus
          ? "Post locked successfully"
          : "Post unlocked successfully",
        post: updatedPost,
      });
    } catch (serviceError) {
      console.error("Service error:", serviceError);
      return NextResponse.json(
        { error: "Failed to update pin status" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error handling pin request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
