
import { create } from "zustand";

type SponsorLegislationType = "sponsored" | "cosponsored" | "combined";

interface CongressMemberStore {
  congressMemberSponsorLegislationType: SponsorLegislationType;
  setCongressMemberSponsorLegislationType: (type: SponsorLegislationType) => void;
  selectedSponsorPolicyArea: string | null;
  setSelectedSponsorPolicyArea: (area: string | null) => void;
}

export const useCongressMemberStore = create<CongressMemberStore>((set) => ({
  congressMemberSponsorLegislationType: "combined",
  setCongressMemberSponsorLegislationType: (type) =>
    set({ congressMemberSponsorLegislationType: type }),
  selectedSponsorPolicyArea: null,
  setSelectedSponsorPolicyArea: (area) =>
    set({ selectedSponsorPolicyArea: area }),
}));
