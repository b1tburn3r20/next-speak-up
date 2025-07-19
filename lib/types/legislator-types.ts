import { CongressMember, CongressTerm, Depiction } from "@prisma/client";

export type SimpleLandingPageLegislatorData = {
  bioguideId: string;
  name: string;
  district?: string;
  state: string;
  role: string;
};

export interface ComprehensiveLegislatorData extends CongressMember {
  depiction: Depiction;
  terms: CongressTerm[];
}
