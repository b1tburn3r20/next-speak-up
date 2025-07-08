import { BillAiSummary, BillSummary, UserBillTrack } from "@prisma/client";

export type LegislationUserTracks = {
  hasViewed: boolean;
  tracking: boolean;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

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
  aiSummaries: BillAiSummary[]; // Array of AI summary objects
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
};
// sponsors and more later.
