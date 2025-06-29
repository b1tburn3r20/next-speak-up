import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  upvotePost,
  downvotePost,
  removeUpvotePost,
  removeDownvotePost,
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
    const { postId, type } = body;

    if (!postId || !type) {
      return NextResponse.json(
        { error: "postId and type are required" },
        { status: 400 }
      );
    }

    // Validate postId is a number
    const numericPostId = parseInt(postId);
    if (isNaN(numericPostId)) {
      return NextResponse.json({ error: "Invalid postId" }, { status: 400 });
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

    // Check if post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: numericPostId },
      select: { id: true, isLocked: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if post is locked
    if (post.isLocked) {
      return NextResponse.json(
        { error: "Cannot vote on locked post" },
        { status: 403 }
      );
    }

    // Execute the appropriate voting action
    let result;
    const userRole = session.user.role.name;

    switch (type) {
      case "upvote":
        result = await upvotePost(numericPostId, userId, userRole);
        break;
      case "downvote":
        result = await downvotePost(numericPostId, userId, userRole);
        break;
      case "remove-upvote":
        await removeUpvotePost(numericPostId, userId, userRole);
        result = { success: true };
        break;
      case "remove-downvote":
        await removeDownvotePost(numericPostId, userId, userRole);
        result = { success: true };
        break;
      default:
        return NextResponse.json(
          { error: "Invalid vote type" },
          { status: 400 }
        );
    }

    // Get updated vote counts
    const updatedCounts = await prisma.forumPost.findUnique({
      where: { id: numericPostId },
      select: {
        _count: {
          select: {
            upvotes: true,
            downvotes: true,
          },
        },
      },
    });

    const netVotes =
      (updatedCounts?._count.upvotes || 0) -
      (updatedCounts?._count.downvotes || 0);

    return NextResponse.json({
      success: true,
      netVotes,
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
