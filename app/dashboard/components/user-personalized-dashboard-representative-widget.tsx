"use client"
import { CongressMemberHouseOfRepresentativesVoteType, CongressMemberPolicyAreaBreakdownRowType } from "@/app/legislators/federal/[bioguideId]/congress-member-types";
import { CongressMember } from "@prisma/client";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import WidgetRepCard from "./rep-widget/rep-card";
import PolicyAreaWidget from "./rep-widget/rep-policy-chart";
import RepRecentVotesWidget from "./rep-widget/rep-recent-votes";
import { TextAnimate } from "@/components/magicui/text-animate";
import { useModalStore } from "@/app/stores/useModalStore";
import { Button } from "@/components/ui/button";
type DataResponse = {
  policyAreaBreakdown: CongressMemberPolicyAreaBreakdownRowType[]
  recentVotes: CongressMemberHouseOfRepresentativesVoteType[]
  representative: CongressMember
}

interface MissingDistrictModalProps {
  pText?: string
  bText?: string
}

export const MissingDistrictModal = ({ pText, bText }: MissingDistrictModalProps) => {
  const setOpen = useModalStore((f) => f.setIsDistrictModalOpen)
  return (
    <div className="bg-accent text-primary border-2 text-center border-primary border-dashed p-4 rounded-3xl">
      <p className="text-sm">{pText ? pText : "Looks like you haven't selected a district yet."} </p>
      <Button variant="link" className="text-sm" onClick={() => setOpen(true)}>
        {bText ? bText : "Select your district"}
      </Button>
    </div>
  )
}
const UserPersonalizedDashboardRepresentativeWidget = () => {
  const [fetching, setFetching] = useState(false)
  const [data, setData] = useState<null | DataResponse>(null)
  const [error, setError] = useState<string>("")
  useEffect(() => {
    const fetchData = async () => {
      setFetching(true)
      try {
        const response = await fetch("/api/dashboard/widgets/user-policy-and-rep")
        if (!response.ok) {
          handleError(response)
        }
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

  const handleError = (error: Response) => {
    setError(error.status.toString())
  }

  const renderError = () => {
    switch (error) {
      case "404":
        return <MissingDistrictModal />
        break;

      default:
        break;
    }
  }



  if (fetching) return (
    <div className="min-h-50 w-full bg-background-light shadow-md rounded-2xl p-4 flex items-center justify-center">
      <Loader className="animate-spin" size={32} />
    </div>
  )


  if (error) {
    return renderError()
  }
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

      <div className="flex flex-col md:flex-row gap-3 w-full">
        <div className="flex flex-col gap-3 md:w-72 lg:w-80 shrink-0">
          <WidgetRepCard congressMember={data.representative} />
          <PolicyAreaWidget data={data.policyAreaBreakdown} />
        </div>
        <div className="min-w-0 flex-1">
          <RepRecentVotesWidget votes={data.recentVotes} />
        </div>
      </div>
    </div>)
}

export default UserPersonalizedDashboardRepresentativeWidget
