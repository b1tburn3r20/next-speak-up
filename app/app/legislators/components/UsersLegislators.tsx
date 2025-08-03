"use client";
import { useUserStore } from "@/app/app/admin/stores/useUserStore";
import { ComprehensiveLegislatorData } from "@/lib/types/legislator-types";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import LegislatorCard from "./LegislatorCard";
import { TextAnimate } from "@/components/magicui/text-animate";

interface UsersLegislatorsProps {
  legislators: ComprehensiveLegislatorData[];
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
  const district = useUserStore((f) => f.userDistrict);
  const state = useUserStore((f) => f.userState);
  const setUserDistrict = useUserStore((f) => f.setUserDistrict);
  const setUserState = useUserStore((f) => f.setUserState);
  const [usersMembers, setUsersMembers] = useState<
    ComprehensiveLegislatorData[]
  >([]);

  useEffect(() => {
    if (district) {
      const usersReps = legislators.filter(
        (legislator) => parseInt(legislator.district) === district
      );
      const usersSen = legislators.filter(
        (legislator) => legislator.district === null
      );
      const res = [...usersReps, ...usersSen];
      setUsersMembers(res);
    }
  }, [district]);

  useEffect(() => {
    if (usersDistrict) {
      setUserDistrict(usersDistrict);
    }
    if (usersState) {
      setUserState(usersState);
    }
  }, []);

  if (!district && !userId) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <DynamicNoUserLoginButton message="Login to view your representatives" />
        <DynamicNoUserLoginButton message="Login to view your senators" />
        <DynamicNoUserLoginButton message="Login to view your senators" />
      </div>
    );
  }

  if (!district)
    return (
      <div className=" ">
        <DynamicNoUserStateButton
          missing="State & District"
          message="Click here to set your district to see your exact delegates"
        />
      </div>
    );

  if (usersMembers) {
    return (
      <div className="w-full ">
        <TextAnimate className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 font-bold [&>span:first-child]:text-primary">
          Your Legislators
        </TextAnimate>
        <div className="flex w-full items-center  justify-center gap-4">
          {usersMembers.map((m, j) => (
            <LegislatorCard userId={userId} legislator={m} key={j} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className=" ">
      <p className="text-center text-gray-600">Couldn't find your members.</p>
    </div>
  );
};

export default UsersLegislators;
