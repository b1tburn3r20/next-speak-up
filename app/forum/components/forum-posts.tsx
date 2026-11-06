import { getAllPosts } from "@/lib/services/forum-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { FullLandingForumPost } from "@/lib/types/forum-types";
import ForumLandingPost from "./forum-landing-post";

const ForumPosts = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userRole = session?.user?.role?.name;
  const posts = (await getAllPosts(
    userId,
    userRole || "Guest"
  )) as unknown as FullLandingForumPost[];

  return (
    <div className="w-full">
      <div className="space-y-2">
        {posts.map((post) => (
          <ForumLandingPost key={post.id} post={post} userId={userId} />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No posts found.</p>
        </div>
      )}
    </div>
  );
};

export default ForumPosts;
