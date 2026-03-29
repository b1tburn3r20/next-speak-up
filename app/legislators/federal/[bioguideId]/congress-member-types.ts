export type CongressMemberPolicyAreaBreakdownRowType = {
  NAY: number
  NOT_VOTING: number
  total: number
  PRESENT: number
  YEA: number
  policyArea: string
}
export type CongressMemberHouseOfRepresentativesVoteTotalsBreakdownType = {
  yea: number
  nay: number
  present: number
  notVoting: number
  voting: number
}
export type CongressMemberHouseOfRepresentativesVoteType = {
  billNumber: string
  billTitle: string
  chamber: string
  congress: number
  date: Date
  description: string | null
  memberVoteId: number
  nameId: string
  policyArea: string
  question: string | null
  rollNumber: number
  time: string | null
  totals: CongressMemberHouseOfRepresentativesVoteTotalsBreakdownType
  voteId: number
  votePosition: string
}
export type CongressMemberSponsorPolicyAreaBreakdownRowType = {
  policyArea: string;
  sponsored: number;
  cosponsored: number;
  combined: number;
};

export type CongressMemberSponsorBillType = {
  nameId: string;
  title: string;
  policyArea: string;
  sponsorType: "sponsored" | "cosponsored";
};
