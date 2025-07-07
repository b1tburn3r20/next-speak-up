import { Suspense } from "react";
import { getBookmarkedPosts } from "@/lib/services/dashboard";
import CurrentlyBookmarked from "./CurrentlyBookmarked";
import { Skeleton } from "@/components/ui/skeleton";

const BookmarkedPostsLoading = () => {
  return (
    <div className="w-full">
      <Skeleton className="h-10 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
};

// Data fetching component
const BookmarkedPostsData = async ({
  userId,
}: {
  userId: string | undefined;
}) => {
  const posts = await getBookmarkedPosts(userId);

  if (posts.length === 0) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-muted-foreground">No bookmarked posts yet.</p>
      </div>
    );
  }

  return <CurrentlyBookmarked posts={posts} />;
};

// Main server component

interface UserBookmarkedForumPostsProps {
  userId: string | null;
}
const UserBookmarkedForumPosts = async ({
  userId,
}: UserBookmarkedForumPostsProps) => {
  return (
    <Suspense fallback={<BookmarkedPostsLoading />}>
      <BookmarkedPostsData userId={userId} />
    </Suspense>
  );
};

export default UserBookmarkedForumPosts;
