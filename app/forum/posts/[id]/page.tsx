import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPostById } from "@/lib/services/forum-service";
import { Metadata } from "next";
import ViewPostContent from "./components/ViewPostContent";
import ViewPostInfo from "./components/ViewPostInfo";
import { incrementPostViews } from "@/lib/services/forum-service";

type PageProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate dynamic metadata
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    // Fetch post data for metadata (you might want to create a separate service for this)
    const postData = await getPostById(null, null, id);

    const createdDate = new Date(postData.createdAt).toLocaleDateString();
    const upvotes = postData._count.upvotes;
    const comments = postData._count.comments;

    return {
      title: `${postData.title} - Forum Post`,
      description: `Forum post by ${postData.author.name} (@${postData.author.username}) with ${upvotes} upvotes and ${comments} comments. Posted on ${createdDate}.`,
      openGraph: {
        title: postData.title,
        description: `By ${postData.author.name} • ${upvotes} upvotes • ${comments} comments • ${createdDate}`,
        type: "article",
        authors: [postData.author.name],
        publishedTime: postData.createdAt.toISOString(),
        modifiedTime: postData.updatedAt.toISOString(),
      },
      twitter: {
        card: "summary",
        title: postData.title,
        description: `Forum post by ${postData.author.name} with ${upvotes} upvotes and ${comments} comments`,
      },
      other: {
        "forum:author": postData.author.name,
        "forum:author-username": postData.author.username,
        "forum:upvotes": upvotes.toString(),
        "forum:comments": comments.toString(),
        "forum:downvotes": postData._count.downvotes.toString(),
        "forum:created": postData.createdAt.toISOString(),
        "forum:updated": postData.updatedAt.toISOString(),
        "forum:type": postData.type,
        "forum:locked": postData.isLocked.toString(),
        "forum:pinned": postData.isPinned.toString(),
      },
    };
  } catch (error) {
    return {
      title: "Forum Post",
      description: "View this forum post and join the discussion.",
    };
  }
}

const Page = async ({ params }: PageProps) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.role?.name;
  const { id } = await params;

  await incrementPostViews(Number(id), userId, userRole);

  const postData = await getPostById(userId, userRole, id);

  return (
    <div className="w-full  mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main content - takes full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2">
          <ViewPostContent post={postData} />
        </div>

        {/* Sidebar - stacked below on mobile, 1/3 on desktop */}
        <div className="lg:col-span-1">
          <ViewPostInfo userId={userId} post={postData} />
        </div>
      </div>
    </div>
  );
};

export default Page;
