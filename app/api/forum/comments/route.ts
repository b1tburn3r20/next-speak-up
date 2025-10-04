// app/api/forum/comments/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createComment } from "@/lib/services/forum-service";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { body: commentBody, postId, parentId } = body;

    // Validation
    if (!commentBody?.trim()) {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
    }

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Create the comment using your existing function
    const comment = await createComment(
      {
        body: commentBody.trim(),
        authorId: session.user.id,
        postId: parseInt(postId),
        ...(parentId && { parentId: parseInt(parentId) }),
      },
      session.user.id,
      session.user.role.name
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
