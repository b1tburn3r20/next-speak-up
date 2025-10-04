// 2. API Route: app/api/forum/posts/delete/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { softDeletePost } from "@/lib/services/forum-service";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    // Validation
    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Soft delete the post using your existing function
    const deletedPost = await softDeletePost(
      parseInt(postId),
      session.user.id,
      session.user.role.name
    );

    return NextResponse.json(
      {
        message: "Post deleted successfully",
        post: deletedPost,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting post:", error);

    // Handle specific error messages
    if (error.message === "Post not found") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (error.message === "Unauthorized: You can only delete your own posts") {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own posts" },
        { status: 403 }
      );
    }

    if (error.message === "Post is already deleted") {
      return NextResponse.json(
        { error: "Post is already deleted" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

// 3. Delete Button Component with Loading State
