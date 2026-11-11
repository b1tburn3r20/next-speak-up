import { FORUM_OPEN } from "@/lib/features";
import { forumClosed } from "@/lib/api/forum-closed";
// app/api/forum/pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pinPost } from "@/lib/services/forum-service";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { can } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  if (!FORUM_OPEN) return forumClosed();
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    if (!can(session, "forum.moderate")) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { postId, pinStatus } = body;

    if (!postId || typeof postId !== "number") {
      return NextResponse.json(
        { error: "Post ID is required and must be a number" },
        { status: 400 }
      );
    }

    if (typeof pinStatus !== "boolean") {
      return NextResponse.json(
        { error: "Pin status is required and must be a boolean" },
        { status: 400 }
      );
    }

    try {
      const updatedPost = await pinPost(postId, pinStatus, userId, session.user.role?.name ?? "Unknown");

      return NextResponse.json({
        success: true,
        message: pinStatus
          ? "Post pinned successfully"
          : "Post unpinned successfully",
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
