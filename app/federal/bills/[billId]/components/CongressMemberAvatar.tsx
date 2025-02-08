import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CongressMemberAvatarProps = {
  member: {
    bioguideId: string;
    name: string;
    state: string;
    party: string;
    depiction?: {
      imageUrl: string;
    };
  };
};

export const CongressMemberAvatar = ({ member }: CongressMemberAvatarProps) => (
  <Link
    href={`/congress/congress-members/${member.bioguideId}`}
    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent group"
  >
    <Avatar className="h-8 w-8">
      <AvatarImage
        src={member.depiction?.imageUrl || ""}
        alt={member.name || ""}
      />
      <AvatarFallback>{member.name?.slice(0, 2)}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col">
      <span className="text-sm font-medium group-hover:text-primary">
        {member.name}
      </span>
      <span className="text-xs text-muted-foreground">
        {member.state} - {member.party}
      </span>
    </div>
  </Link>
);
