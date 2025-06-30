import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  upvoteComment,
  downvoteComment,
  removeUpvoteComment,
  removeDownvoteComment,
} from "@/lib/services/forum-service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/prisma/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  try {
    // Get data from request body
    const body = await request.json();
    const { commentId, type } = body;

    if (!commentId || !type) {
      return NextResponse.json(
        { error: "commentId and type are required" },
        { status: 400 }
      );
    }

    // Validate commentId is a number
    const numericCommentId = parseInt(commentId);
    if (isNaN(numericCommentId)) {
      return NextResponse.json({ error: "Invalid commentId" }, { status: 400 });
    }

    // Validate type
    const validTypes = [
      "upvote",
      "downvote",
      "remove-upvote",
      "remove-downvote",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
    }

    // Check if comment exists
    const comment = await prisma.forumComment.findUnique({
      where: { id: numericCommentId },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check if user is trying to vote on their own comment
    if (comment.authorId === userId) {
      return NextResponse.json(
        { error: "Cannot vote on your own comment" },
        { status: 403 }
      );
    }

    // Execute the appropriate voting action
    let result;
    const userRole = session.user.role.name;

    switch (type) {
      case "upvote":
        result = await upvoteComment(numericCommentId, userId, userRole);
        break;
      case "downvote":
        result = await downvoteComment(numericCommentId, userId, userRole);
        break;
      case "remove-upvote":
        await removeUpvoteComment(numericCommentId, userId, userRole);
        result = { success: true };
        break;
      case "remove-downvote":
        await removeDownvoteComment(numericCommentId, userId, userRole);
        result = { success: true };
        break;
      default:
        return NextResponse.json(
          { error: "Invalid vote type" },
          { status: 400 }
        );
    }

    // Get updated vote counts
    const updatedCounts = await prisma.forumComment.findUnique({
      where: { id: numericCommentId },
      select: {
        _count: {
          select: {
            upvotes: true,
            downvotes: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      upvotes: updatedCounts?._count.upvotes || 0,
      downvotes: updatedCounts?._count.downvotes || 0,
      action: type,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
