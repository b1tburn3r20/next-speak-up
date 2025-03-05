// components/bill-votes/member-vote-card.jsx
"use client";
import Link from "next/link";
import { CheckCircle2, Heart, MinusCircle, XCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { voteStyles } from "./vote-summary-card";

export const getVoteDisplay = (position) => {
  const displays = {
    YEA: {
      text: "Voted Yes",
      icon: CheckCircle2,
      classes: voteStyles.YEA,
    },
    NAY: {
      text: "Voted No",
      icon: XCircle,
      classes: voteStyles.NAY,
    },
    PRESENT: {
      text: "Present",
      icon: MinusCircle,
      classes: voteStyles.PRESENT,
    },
    NOT_VOTING: {
      text: "Did Not Vote",
      icon: MinusCircle,
      classes: voteStyles.NOT_VOTING,
    },
  };
  return displays[position] || displays.NOT_VOTING;
};

export const MemberVoteCard = ({ member }) => {
  const voteStyle = getVoteDisplay(member.votePosition);
  const VoteIcon = voteStyle.icon;

  return (
    <Link
      href={`/congress/congress-members/${member.bioguideId}`}
      className={cn(
        "group flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-200 hover:pl-6 rounded-lg",
        member.isFavorited && "border-b mb-2"
      )}
    >
      <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          {member.depiction?.imageUrl ? (
            <AvatarImage
              src={member.depiction.imageUrl}
              alt={`${member.firstName} ${member.lastName}`}
            />
          ) : (
            <AvatarFallback>
              {`${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium transition-colors">
              {member.firstName} {member.lastName}
            </span>
            {member.isFavorited && (
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">{member.state}</div>
        </div>
      </div>
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${voteStyle.classes}`}
      >
        <VoteIcon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{voteStyle.text}</span>
      </div>
    </Link>
  );
};
