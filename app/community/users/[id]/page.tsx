import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSoftUserByIdWithMetrics } from "@/lib/services/user";
import { Metadata } from "next";

type PageProps = {
  params: { id: string };
};

// Generate dynamic metadata
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    // Fetch user data for metadata
    const userData = await getSoftUserByIdWithMetrics(id);

    return {
      title: `${userData?.username || "User"} - Profile`,
      description: `View ${userData?.username || "user"}'s profile with ${
        userData?.metrics.totalPosts
      } posts and ${userData?.metrics.totalComments} comments.`,
      openGraph: {
        title: `${userData?.username || "User"} Profile`,
        description: `${userData?.role?.name || "Member"} • ${
          userData?.metrics.totalPosts
        } posts • ${userData?.metrics.totalComments} comments`,
        type: "profile",
      },
      twitter: {
        card: "summary",
        title: `${userData?.username || "User"} Profile`,
        description: `Forum user with ${userData?.metrics.totalPosts} posts and ${userData?.metrics.totalComments} comments`,
      },
    };
  } catch (error) {
    return {
      title: "User Profile",
      description: "View this user's profile and community activity.",
    };
  }
}

const Page = async ({ params }: PageProps) => {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user.role?.name;
  const { id } = await params;

  // Get soft user metrics for the user profile
  const userMetrics = await getSoftUserByIdWithMetrics(id);

  if (!userMetrics) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-gray-900">User Not Found</h1>
          <p className="text-gray-600 mt-2">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main content - takes full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2">
          <div className=" rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold mb-4">User Profile</h1>
            <div className="flex items-center gap-4 mb-6">
              {userMetrics.image && (
                <img
                  src={userMetrics.image}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {userMetrics.username || "Anonymous User"}
                </h2>
                <p className="text-gray-600">
                  {userMetrics.role?.name || "Member"}
                </p>
                <p className="text-gray-500 text-sm">
                  Member for {userMetrics.daysSinceJoining} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - stacked below on mobile, 1/3 on desktop */}
        <div className="lg:col-span-1">
          {/* User Metrics Section */}
          <div className="mt-6 p-4  rounded-lg">
            <h3 className="text-lg font-semibold mb-4">User Stats</h3>

            {/* Content Creation */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Content Created
              </h4>
              <div className="space-y-1 text-sm">
                <div>Total Posts: {userMetrics.metrics.totalPosts}</div>
                <div>Total Comments: {userMetrics.metrics.totalComments}</div>
              </div>
            </div>

            {/* Engagement Received */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Engagement Received
              </h4>
              <div className="space-y-1 text-sm">
                <div>Post Views: {userMetrics.metrics.totalPostViews}</div>
                <div>Post Upvotes: {userMetrics.metrics.totalPostUpvotes}</div>
                <div>
                  Post Downvotes: {userMetrics.metrics.totalPostDownvotes}
                </div>
                <div>
                  Comments on Posts: {userMetrics.metrics.totalCommentsReceived}
                </div>
                <div>
                  Comment Upvotes: {userMetrics.metrics.totalCommentUpvotes}
                </div>
                <div>
                  Comment Downvotes: {userMetrics.metrics.totalCommentDownvotes}
                </div>
              </div>
            </div>

            {/* Engagement Given */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Engagement Given
              </h4>
              <div className="space-y-1 text-sm">
                <div>Upvotes Given: {userMetrics.metrics.upvotesGiven}</div>
                <div>Bookmarks Made: {userMetrics.metrics.bookmarksMade}</div>
              </div>
            </div>

            {/* Platform Activity */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">
                Platform Activity
              </h4>
              <div className="space-y-1 text-sm">
                <div>Bill Votes: {userMetrics.metrics.billVotes}</div>
                <div>
                  Favorited Members: {userMetrics.metrics.favoritedMembers}
                </div>
              </div>
            </div>

            {/* Calculated Stats */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Performance</h4>
              <div className="space-y-1 text-sm">
                <div>
                  Avg Views per Post: {userMetrics.metrics.avgViewsPerPost}
                </div>
                <div>
                  Post Upvote Ratio: {userMetrics.metrics.postUpvoteRatio}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
