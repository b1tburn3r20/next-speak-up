// app/api/forum/bookmark/route.ts
import { NextRequest, NextResponse } from "next/server";
import { unbookmarkPost, bookmarkPost } from "@/lib/services/forum-service";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized, no user id", { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId, bookmarkStatus } = body;

    if (!postId || typeof postId !== "number") {
      return NextResponse.json(
        { error: "Post ID is required and must be a number" },
        { status: 400 }
      );
    }

    if (typeof bookmarkStatus !== "boolean") {
      return NextResponse.json(
        { error: "Bookmark status is required and must be a boolean" },
        { status: 400 }
      );
    }

    try {
      if (bookmarkStatus) {
        const bookmark = await bookmarkPost(postId, userId, "user"); // You might want to get actual user role
        return NextResponse.json({
          success: true,
          message: "Post bookmarked successfully",
          bookmark,
        });
      } else {
        // Remove bookmark
        await unbookmarkPost(postId, userId, "user"); // You might want to get actual user role
        return NextResponse.json({
          success: true,
          message: "Bookmark removed successfully",
        });
      }
    } catch (serviceError) {
      console.error("Service error:", serviceError);
      return NextResponse.json(
        { error: "Failed to update bookmark status" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error handling bookmark request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
