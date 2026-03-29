import { BillAiSummary, BillSummary, CongressMember, Depiction, PolicyArea } from "@prisma/client";
import { number, string } from "zod";

export type LegislationUserTracks = {
  hasViewed: boolean;
  tracking: boolean;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
export interface CongressMemberWithDepiction extends CongressMember {
  depiction: Depiction
}
export type FullLegislation = {
  id: number;
  congress: number;
  introducedDate: Date | null;
  number: string;
  title: string;
  type: string;
  url: string;
  amendmentNumber: string | null;
  policy_area_id: number | null;
  createdAt: Date;
  updatedAt: Date;
  name_id: string;
  summaries: BillSummary[]; // Array of summary objects
  fine_print: string | null;
  hidden_implications: string | null;
  key_terms: string | null;
  bill_size: string | null;
  word_count: number;
  userTracks?: LegislationUserTracks[];
  userVotes?: LegislationUserVote[];
  actions?: LegislationAction[];
  relatedBills?: RelatedBill[];
};
export type LegislationAction = {
  actionCode: string;
  actionDate: Date;
  createdAt: Date;
  id: number;
  legislationId: number;
  text: string;
  type: string;
  updatedAt: Date;
};
export type LegislationUserVote = {
  votePosition: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LegislationUserTracking = {
  hasViewed: boolean;
  viewedAt: Date | null;
  tracking: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RelatedBill = {
  createdAt: Date;
  id: number;
  legislationId: number;
  relatedNameId: string;
  relationshipType: string;
  updatedAt: Date;
  title: string;
};

export type FullUserLegislationData = {
  legislation: FullLegislation;
  userVote: LegislationUserVote;
  userTracking: LegislationUserTracking;
  sponsors: CongressMemberWithDepiction[]
  cosponsors: CongressMemberWithDepiction[]
  policyArea: any
};


export type CongressionalVoteMemberVote = {
  createdAt: Date
  id: number
  member: CongressMember
  memberId: number
  party: string
  state: string
  updatedAt: Date
  voteId: number
  votePosition: string
}

export type CongressionalVoteType = {
  billNumber: string
  chamber: string
  congress: number
  createdAt: Date
  date: Date
  description: string | null
  id: number
  memberVotes: CongressionalVoteMemberVote[]
  name_id: string
  question: string | null
  result: string
  rollNumber: number
  time: Date | null
  totalNay: number
  totalNotVoting: number
  totalPresent: number
  totalVoting: number
  totalYea: number
  updatedAt: Date
}






// sponsors and more later.
