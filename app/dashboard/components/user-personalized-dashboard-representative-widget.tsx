"use client"
import { CongressMemberHouseOfRepresentativesVoteType, CongressMemberPolicyAreaBreakdownRowType } from "@/app/legislators/federal/[bioguideId]/congress-member-types";
import { CongressMember } from "@prisma/client";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import WidgetRepCard from "./rep-widget/rep-card";
import PolicyAreaWidget from "./rep-widget/rep-policy-chart";
import RepRecentVotesWidget from "./rep-widget/rep-recent-votes";
import { Label } from "@/components/ui/label";
import { TextAnimate } from "@/components/magicui/text-animate";

type DataResponse = {
  policyAreaBreakdown: CongressMemberPolicyAreaBreakdownRowType[]
  recentVotes: CongressMemberHouseOfRepresentativesVoteType[]
  representative: CongressMember
}

const UserPersonalizedDashboardRepresentativeWidget = () => {
  const [fetching, setFetching] = useState(false)
  const [data, setData] = useState<null | DataResponse>(null)

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true)
      try {
        const response = await fetch("/api/dashboard/widgets/user-policy-and-rep")
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
        const json = await response.json()
        setData(json.data)
      } catch (error) {
        console.error("Error fetching representative data:", error)
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [])

  if (fetching) return (
    <div className="min-h-50 w-full bg-background-light shadow-md rounded-2xl p-4 flex items-center justify-center">
      <Loader className="animate-spin" size={32} />
    </div>
  )

  if (!data) return null

  return (
    <div className="p-3">
      <TextAnimate
        animation="blurInUp"
        by="word"
        className="text-2xl mb-2 font-bold [&>span:last-child]:text-primary px-2 sm:px-0"
      >
        Your Rep Recap
      </TextAnimate>

      <div className="flex gap-3 w-full h-full">
        <div className="flex flex-col gap-3">
          <WidgetRepCard congressMember={data.representative} />
          <PolicyAreaWidget data={data.policyAreaBreakdown} />
        </div>
        <div className="min-w-0">
          <RepRecentVotesWidget votes={data.recentVotes} />
        </div>
      </div>
    </div>
  )
}

export default UserPersonalizedDashboardRepresentativeWidget
