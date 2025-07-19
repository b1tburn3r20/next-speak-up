"use client";
import { SimpleLandingPageLegislatorData } from "@/lib/types/legislator-types";
import dynamic from "next/dynamic";
import LegislatorCard from "./LegislatorCard";
import NoUserLoginButton from "@/app/1Components/components/General/NoUserLoginButton";
import NoUserStateButton from "@/app/1Components/components/General/NoUserStateButton";
import { TextAnimate } from "@/components/magicui/text-animate";

const DynamicNoUserLoginButton = dynamic(
  () => import("@/app/1Components/components/General/NoUserLoginButton"),
  { ssr: false }
);

interface UsersStateLegislatorsProps {
  legislators: SimpleLandingPageLegislatorData[];
  userId: string;
  usersState: string | null;
}

const UsersStateLegislators = ({
  legislators,
  userId,
  usersState,
}: UsersStateLegislatorsProps) => {
  if (!userId) {
    return (
      <div className="">
        <DynamicNoUserLoginButton message="Login to see your congress members here!" />
      </div>
    );
  }

  return (
    <div className="">
      {usersState ? (
        <div>
          <TextAnimate className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:first-child]:text-primary">
            Your State Legislators
          </TextAnimate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {legislators.map((f) => (
              <LegislatorCard
                key={f.bioguideId}
                legislator={f}
                userId={userId}
              />
            ))}
          </div>
        </div>
      ) : (
        <DynamicNoUserLoginButton
          missing="Select State"
          message="To see your states representatives please select your state here."
        />
      )}
    </div>
  );
};

export default UsersStateLegislators;
