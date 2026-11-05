import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { playMemberVotesAnimation } from "./moreanimations";

interface MemberVote {
  bioguideId: string;
  firstName: string;
  lastName: string;
  state: string;
  depiction: {
    imageUrl: string;
  };
  votePosition: string;
  isFavorited: boolean;
  isUser?: boolean;
}

interface MemberVoteAvatarsProps {
  memberVotes: MemberVote[];
  userVoteDirection: boolean;
  show: boolean;
  userImage: string;
}

export function MemberVoteAvatars({
  memberVotes,
  userVoteDirection,
  show,
  userImage,
}: MemberVoteAvatarsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter for favorited members and add user vote
  const favoritedMembers = memberVotes
    .filter((member) => member.isFavorited)
    .map((member) => ({ ...member, isUser: false }));

  // Add user's vote to the array with the actual user image
  const allVotes = [
    ...favoritedMembers,
    {
      bioguideId: "user",
      firstName: "Your",
      lastName: "Vote",
      state: "",
      depiction: {
        imageUrl: userImage,
      },
      votePosition: userVoteDirection ? "YEA" : "NAY",
      isFavorited: true,
      isUser: true,
    },
  ];

  useEffect(() => {
    if (!show) return;

    const timeline = playMemberVotesAnimation(
      containerRef.current,
      allVotes,
      userVoteDirection
    );

    return () => {
      timeline?.kill();
    };
  }, [show, userVoteDirection, allVotes]);

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ zIndex: 55 }}
      >
        {allVotes.map((member) => (
          <Tooltip key={member.bioguideId}>
            <TooltipTrigger asChild>
              {member.isUser ? (
                <Avatar
                  className="member-avatar border-2 invisible w-20 h-20 border-primary"
                  style={{
                    opacity: 0,
                    transform: "scale(0)",
                  }}
                >
                  <AvatarImage
                    src={member.depiction.imageUrl}
                    alt={`${member.firstName} ${member.lastName}`}
                  />
                </Avatar>
              ) : (
                <Avatar
                  className="member-avatar border-2 invisible w-12 h-12 border-card"
                  style={{
                    opacity: 0,
                    transform: "scale(0)",
                  }}
                >
                  <Link
                    href={`/congress/congress-members/${member.bioguideId}`}
                    target="_blank"
                  >
                    <AvatarImage
                      src={member.depiction.imageUrl}
                      alt={`${member.firstName} ${member.lastName}`}
                    />
                  </Link>
                </Avatar>
              )}
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-popover text-popover-foreground"
            >
              <p className="font-bold text-xl shadow-lg">
                {member.isUser
                  ? "You"
                  : `${member.firstName} ${member.lastName}`}
                {member.state && ` (${member.state})`}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
