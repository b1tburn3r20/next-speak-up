import { useLoginStore } from "@/app/navbar/useLoginStore"
import BlockB from "@/components/cb/block-b"
import { Button } from "@/components/ui/button"
import { UserSession } from "@/lib/types/user-types"
import { useEffect, useState } from "react"
import { useBillPageStore } from "../useBillPageStore"
import { Loader } from "lucide-react"


interface FederalLegislationVoteButtonsProps {
  session: UserSession
}
const FederalLegislationVoteButtons = ({ session }: FederalLegislationVoteButtonsProps) => {
  const bill = useBillPageStore((f) => f.billData)
  const setIsLoginSignupModalOpen = useLoginStore((f) => f.setIsLoginDialogOpen)
  const setVote = useBillPageStore((f) => f.setVote)
  const [submitting, setSubmitting] = useState<boolean>(false)
  //
  const apiVote = async (yea: boolean) => {
    if (submitting) return
    if (!session?.id) {
      console.log(session)
      handleNeedLogin()
    }
    setSubmitting(true)
    const vote = yea ? "YEA" : "NAY"
    try {
      const response: Response = await fetch("/api/bills/vote",
        {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ legislationNameId: bill?.legislation?.name_id, vote: vote }),
          headers: {
            "Content-Type": "application/json"
          }
        })
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setVote(data.data?.userVote)
        }
      }
    } catch (error) {
      console.error("Something went wrong submitting")
    } finally {
      setSubmitting(false)
    }
  }
  //
  const handleNeedLogin = () => {
    setIsLoginSignupModalOpen(true)
  }
  const votedNo = bill?.userVote?.votePosition === "NAY"
  const votedYes = bill?.userVote?.votePosition === "YEA"

  return (
    <BlockB className="gap-2 items-center grid grid-cols-2">
      <Button disabled={votedNo || submitting} onClick={() => apiVote(false)} variant="destructive" size="huge">
        {submitting ? (<div className="flex gap-2 items-center">
          <Loader className="animate-spin" />
          <span className="animate-pulse">
            Saving...
          </span>
        </div>) : (
          "No"
        )}
      </Button>
      <Button disabled={votedYes || submitting} onClick={() => apiVote(true)} size="huge">
        {submitting ? (<div className="flex gap-2 items-center">
          <Loader className="animate-spin" />
          <span className="animate-pulse">
            Saving...
          </span>
        </div>) : (
          "Yes"
        )}
      </Button>
    </BlockB>

  )
}

export default FederalLegislationVoteButtons
