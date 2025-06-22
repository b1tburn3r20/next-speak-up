import { UserBillTrack } from "@prisma/client";

export type LegislationUserTracks = {
  hasViewed: boolean;
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
  summary: string | null;
  ai_summary: string | null;
  fine_print: string | null;
  hidden_implications: string | null;
  key_terms: string | null;
  bill_size: string | null;
  word_count: number;
  userTracks: LegislationUserTracks[];
};

export type LegislationUserVote = {
  votePosition: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LegislationUserTracking = {
  hasViewed: boolean;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FullUserLegislationData = {
  legislation: FullLegislation;
  userVote: LegislationUserVote;
  userTracking: LegislationUserTracking;
};
// sponsors and more later.
