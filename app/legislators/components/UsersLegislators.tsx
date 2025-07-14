"use client";
import { SimpleLandingPageLegislatorData } from "@/lib/types/legislator-types";
import dynamic from "next/dynamic";

interface UsersLegislatorsProps {
  legislators: SimpleLandingPageLegislatorData[];
  userId: string;
  usersDistrict: number | null;
  usersState: string | null;
}
const DynamicNoUserStateButton = dynamic(
  () => import("@/app/1Components/components/General/NoUserStateButton"),
  { ssr: false }
);
const DynamicNoUserLoginButton = dynamic(
  () => import("@/app/1Components/components/General/NoUserLoginButton"),
  { ssr: false }
);
const UsersLegislators = ({
  legislators,
  userId,
  usersDistrict,
  usersState,
}: UsersLegislatorsProps) => {
  if (!usersDistrict && !userId) {
    return (
      <DynamicNoUserLoginButton message="Login to view your representatives and legislators faster!" />
    );
  }

  if (!usersDistrict)
    return (
      <div>
        <DynamicNoUserStateButton
          missing="State & District"
          message="Click here to set your district to see your exact delegates"
        />
      </div>
    );
};

export default UsersLegislators;
