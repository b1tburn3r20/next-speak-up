import { Card } from "@/components/ui/card";
import { Bookmark, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";

const EmptyForumPostCard = () => {
  return (
    <>
      {/* Desktop Empty Card */}
      <div className="hidden md:block">
        <Card className="h-[300px] aspect-square select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-dashed border-border/50 rounded-3xl">
          <div className="p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="mb-6">
              <div className="relative">
                <Bookmark className="w-16 h-16 text-muted-foreground/30 mx-auto mb-2" />
                <MessageSquare className="w-8 h-8 text-muted-foreground/20 absolute -top-2 -right-2" />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No Bookmarked Posts
            </h3>

            <p className="text-sm text-muted-foreground/70 mb-6 max-w-[200px]">
              Start bookmarking interesting forum posts to see them here
            </p>

            <Link
              href="/forum"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Browse Forum
            </Link>
          </div>
        </Card>
      </div>

      {/* Mobile Empty Card */}
      <div className="block md:hidden">
        <Card className="h-[200px] w-[280px] select-none group cursor-pointer hover:shadow-lg transition-all duration-300 relative overflow-hidden border-2 border-dashed border-border/50 rounded-2xl">
          <div className="p-4 h-full flex flex-col items-center justify-center text-center">
            <div className="mb-4">
              <div className="relative">
                <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <MessageSquare className="w-5 h-5 text-muted-foreground/20 absolute -top-1 -right-1" />
              </div>
            </div>

            <h3 className="text-base font-semibold text-muted-foreground mb-2">
              No Bookmarked Posts
            </h3>

            <p className="text-xs text-muted-foreground/70 mb-4 max-w-[180px]">
              Start bookmarking posts to see them here
            </p>

            <Link
              href="/forum"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium"
            >
              <Plus className="w-3 h-3" />
              Browse Forum
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
};

export default EmptyForumPostCard;
