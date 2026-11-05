import { Eye } from "lucide-react";

interface ForumPostViewsProps {
  postViews: number;
}

const ForumPostViews = ({ postViews }: ForumPostViewsProps) => {
  return (
    <div className="flex gap-1 items-center">
      <Eye className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground font-semibold">{postViews}</p>
    </div>
  );
};

export default ForumPostViews;
