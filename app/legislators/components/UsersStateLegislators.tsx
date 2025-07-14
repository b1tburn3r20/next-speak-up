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
      <DynamicNoUserLoginButton message="Login to see your congress members here!" />
    );
  }
  console.log(legislators);

  return (
    <div>
      {usersState ? (
        <div>
          <TextAnimate className="text-4xl m-4 font-bold [&>span:first-child]:text-primary">
            Your State Legislators
          </TextAnimate>
          {legislators.map((f) => (
            <LegislatorCard key={f.bioguideId} legislator={f} userId={userId} />
          ))}
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
