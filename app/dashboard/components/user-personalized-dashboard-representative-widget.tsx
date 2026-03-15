"use client"
import CongressMemberCard from "@/app/legislators/federal/[bioguideId]/components/CongressMemberCard";
import HouseVotesList from "@/app/legislators/federal/[bioguideId]/components/HouseVoteList";
import PolicyAreaBreakdown from "@/app/legislators/federal/[bioguideId]/components/PolicyAreaBreakdown";
import PolicyAreaBreakdownTable from "@/app/legislators/federal/[bioguideId]/components/PolicyAreaBreakdownTable";
import { CongressMemberHouseOfRepresentativesVoteType, CongressMemberPolicyAreaBreakdownRowType } from "@/app/legislators/federal/[bioguideId]/congress-member-types";
import { CongressMember } from "@prisma/client";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";

type DataResponse = {
  policyAreaBreakdown: CongressMemberPolicyAreaBreakdownRowType[]  // array, not single object
  recentVotes: CongressMemberHouseOfRepresentativesVoteType[]
  representative: CongressMember
}

const UserPersonalizedDashboardRepresentativeWidget = () => {
  const [fetching, setFetching] = useState<boolean>(false)
  const [data, setData] = useState<null | DataResponse>(null)

  const fetchData = async () => {
    setFetching(true)
    try {
      const response = await fetch("/api/dashboard/widgets/user-policy-and-rep")
      if (!response.ok) {
        throw new Error(`Failed to fetch representative data: ${response.status}`)
      }
      const json = await response.json()
      setData(json.data)
    } catch (error) {
      console.error("Error fetching representative data:", error)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (fetching) {
    return (
      <div className="h-full w-full bg-background-light shadow-md rounded-3xl p-4">
        <Loader className="animate-spin" size={70} />
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="p-4 flex justify-center items-center w-full h-full">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <CongressMemberCard congressMember={data.representative} />
            <PolicyAreaBreakdown data={data.policyAreaBreakdown} />
          </div>
          <PolicyAreaBreakdownTable data={data.policyAreaBreakdown} />
        </div>
        <HouseVotesList votes={data.recentVotes} />
      </div>
    </div>
  )
}

export default UserPersonalizedDashboardRepresentativeWidget
