"use client"
import { CongressionalVoteType } from "@/lib/types/bill-types"
import { STATE_NAMES } from "@/lib/constants/state-names"
import CongressMemberVoteRow from "./congress-member-vote-row"

interface BillsPersonalizedLegislatorsVoteContainerProps {
  votes: CongressionalVoteType
  state: string | null
  district: string | null
}
const BillsPersonalizedLegislatorsVoteContainer = ({ votes, state, district }: BillsPersonalizedLegislatorsVoteContainerProps) => {


  if (!votes?.memberVotes?.length) {
    return null
  }

  const votez = votes?.memberVotes
  const foundStateCode = Object.keys(STATE_NAMES).find((key) => STATE_NAMES[key] === state);

  if (!foundStateCode) {
    return null
  }

  const rep = votez?.filter((f) => f.state === foundStateCode).find((row) => row.member.district === String(district))

  return (
    <div>
      <CongressMemberVoteRow congressMember={rep} />
    </div>
  )
}

export default BillsPersonalizedLegislatorsVoteContainer
