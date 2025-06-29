import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createPost } from "@/lib/services/forum-service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return new NextResponse("Unauthorized, no user id", { status: 401 });
  }

  // Get data from request body
  const formBody = await request.json();
  const { title, body, type, tags } = formBody;

  if (!title || !body || !type) {
    return NextResponse.json({ error: "Form incomplete!" }, { status: 400 });
  }

  const data = {
    title: title,
    body: body,
    type: type,
    authorId: userId,
    tagIds: tags,
  };

  try {
    const createdPost = await createPost(data, userId, session.user.role.name);

    return NextResponse.json(
      {
        created: createdPost,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("creating post:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
