import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface UserReferenceContainerProps {
  id: string;
  username: string | null;
  image: string | null;
  role: string;
}

const UserReferenceContainer = ({
  id,
  username,
  image,
  role,
}: UserReferenceContainerProps) => {
  const renderAvatarContent = () => {
    return (
      <>
        <AvatarImage
          src={image || ""}
          alt={username || "User"}
          referrerPolicy="no-referrer"
        />
        <AvatarFallback className="rounded-lg bg-primary/10">
          {username?.slice(0, 2).toUpperCase() || "U"}
        </AvatarFallback>
      </>
    );
  };

  return (
    <Link
      href={`/community/users/${id}`}
      className="flex items-center gap-2 hover:opacity-80"
    >
      <Avatar className="w-8 h-8 rounded-lg">{renderAvatarContent()}</Avatar>
      <div className="flex flex-col justify-center">
        <span className="text-sm truncate text-muted-foreground  font-bold">
          {username || "User"}
        </span>
        <p className="text-muted-foreground italic text-xs">{role}</p>
      </div>
    </Link>
  );
};

export default UserReferenceContainer;
