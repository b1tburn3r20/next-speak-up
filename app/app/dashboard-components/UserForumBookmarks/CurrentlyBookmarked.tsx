import { TextAnimate } from "@/components/magicui/text-animate";
import { ForumPost } from "@prisma/client";
import React from "react";
import BookmarkedPostsCarousel from "./BookmarkedPostsCarousel";

interface CurrentlyBookmarkedProps {
  posts: (ForumPost & {
    author: { name: string | null; image: string | null };
    _count: {
      comments: number;
      upvotes: number;
      downvotes: number;
      bookmarks: number;
    };
    isBookmarked?: boolean;
  })[];
}

const CurrentlyBookmarked = ({ posts }: CurrentlyBookmarkedProps) => {
  return (
    <div className="w-full">
      <TextAnimate
        animation="blurInUp"
        by="word"
        className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:last-child]:text-primary px-2 sm:px-0"
      >
        Currently Bookmarked
      </TextAnimate>
      <BookmarkedPostsCarousel posts={posts} />
    </div>
  );
};

export default CurrentlyBookmarked;
