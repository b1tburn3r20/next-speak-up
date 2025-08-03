import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fixGoogleImageUrl } from "@/lib/utils";
import { User } from "@prisma/client";
import { ArrowRightSquareIcon, ArrowUpRightSquareIcon } from "lucide-react";
import Link from "next/link";

const SelectUsers = ({ users }: { users: User[] }) => {
  if (!users || users.length === 0) {
    return null;
  }

  return (
    <div className=" place-items-center m-4 gap-4 items-start grid justify-between grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex w-full h-full space-y-2 p-2 bg-muted/50 rounded-lg flex-col w-fit justify-center items-center"
        >
          <Avatar className="w-[100px] h-[100px] rounded-lg">
            <AvatarImage
              src={fixGoogleImageUrl(user.image)}
              alt={user.name ? `Avatar for ${user.name}` : "User avatar"}
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <AvatarFallback delayMs={0}>
              {user.name?.slice(0, 2).toUpperCase() ?? "??"}
            </AvatarFallback>
          </Avatar>
          <div className="bg-muted p-2 rounded-lg">
            <p className="text-center">{user.name || user.username}</p>
            <p className="text-muted-foreground italic">{user.email}</p>
          </div>
          <Link href={`/app/admin/permissions/${user.id}`}>
            <Button className="w-full" variant="ghost">
              View <ArrowUpRightSquareIcon />
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default SelectUsers;
