// app/api/forum/comments/delete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { softDeleteComment } from "@/lib/services/forum-service";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commentId } = body;

    // Validation
    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Soft delete the comment using your existing function
    const deletedComment = await softDeleteComment(
      parseInt(commentId),
      session.user.id,
      session.user.role.name
    );

    return NextResponse.json(
      {
        message: "Comment deleted successfully",
        comment: deletedComment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting comment:", error);

    // Handle specific error messages
    if (error.message === "Comment not found") {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (
      error.message === "Unauthorized: You can only delete your own comments"
    ) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own comments" },
        { status: 403 }
      );
    }

    if (error.message === "Comment is already deleted") {
      return NextResponse.json(
        { error: "Comment is already deleted" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
