"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ForumPost } from "@prisma/client";
import ForumPostViewCard from "./ForumPostViewCard";
import EmptyForumPostCard from "./EmptyForumPostCard";

interface BookmarkedPostsCarouselProps {
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

const BookmarkedPostsCarousel = ({ posts }: BookmarkedPostsCarouselProps) => {
  if (posts.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto">
        <EmptyForumPostCard />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Fade overlays for desktop - hidden on mobile */}
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 lg:w-72 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden sm:block" />

      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full px-2 sm:px-4"
      >
        <CarouselContent className="gap-2 sm:gap-4 -ml-2 sm:-ml-4">
          {posts.map((post) => (
            <CarouselItem
              key={post.id}
              className="basis-[280px] sm:basis-[320px] lg:basis-auto min-w-0 pl-2 sm:pl-4"
            >
              <ForumPostViewCard post={post} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation buttons - smaller on mobile */}
        <CarouselPrevious className="hidden sm:flex -left-2 sm:-left-4 lg:-left-12" />
        <CarouselNext className="hidden sm:flex -right-2 sm:-right-4 lg:-right-12" />
      </Carousel>

      {/* Mobile navigation dots/indicators could go here if needed */}
    </div>
  );
};

export default BookmarkedPostsCarousel;
