// Display text for data values. Everything shown to users about status and seats comes from here.

export type BillStatusValue =
  | "INTRODUCED"
  | "IN_COMMITTEE"
  | "REPORTED"
  | "PASSED_ORIGIN_CHAMBER"
  | "PASSED_BOTH_CHAMBERS"
  | "AGREED_TO"
  | "RESOLVING_DIFFERENCES"
  | "TO_EXECUTIVE"
  | "SIGNED"
  | "VETOED"
  | "VETO_OVERRIDDEN"
  | "BECAME_LAW"
  | "FAILED";

export const BILL_STATUS_LABELS: Record<BillStatusValue, string> = {
  INTRODUCED: "Introduced",
  IN_COMMITTEE: "In committee",
  REPORTED: "Reported by committee",
  PASSED_ORIGIN_CHAMBER: "Passed one chamber",
  PASSED_BOTH_CHAMBERS: "Passed both chambers",
  AGREED_TO: "Agreed to",
  RESOLVING_DIFFERENCES: "Resolving differences",
  TO_EXECUTIVE: "Sent to the President",
  SIGNED: "Signed",
  VETOED: "Vetoed",
  VETO_OVERRIDDEN: "Veto overridden",
  BECAME_LAW: "Became law",
  FAILED: "Failed",
};

/** The steps of a bill's path, for the progress display. */
export const BILL_STAGES = ["Introduced", "Committee", "Floor", "Both chambers", "President", "Law"];

const STAGE_INDEX: Record<BillStatusValue, number> = {
  INTRODUCED: 0,
  IN_COMMITTEE: 1,
  REPORTED: 1,
  PASSED_ORIGIN_CHAMBER: 2,
  FAILED: 2,
  AGREED_TO: 3,
  PASSED_BOTH_CHAMBERS: 3,
  RESOLVING_DIFFERENCES: 3,
  TO_EXECUTIVE: 4,
  VETOED: 4,
  SIGNED: 5,
  VETO_OVERRIDDEN: 5,
  BECAME_LAW: 5,
};

export function billStageIndex(status: BillStatusValue): number {
  return STAGE_INDEX[status] ?? 0;
}

const BILL_TYPE_LABELS: Record<string, string> = {
  hr: "H.R.",
  s: "S.",
  hjres: "H.J.Res.",
  sjres: "S.J.Res.",
  hconres: "H.Con.Res.",
  sconres: "S.Con.Res.",
  hres: "H.Res.",
  sres: "S.Res.",
};

export function billLabel(billType: string, number: number): string {
  return `${BILL_TYPE_LABELS[billType.toLowerCase()] ?? billType.toUpperCase()} ${number}`;
}

export function billSlug(congress: number | string, billType: string, number: number): string {
  return `us-${congress}-${billType.toLowerCase()}-${number}`;
}

const PARTY_LABELS: Record<string, string> = {
  D: "Democrat",
  R: "Republican",
  I: "Independent",
  ID: "Independent Democrat",
  L: "Libertarian",
};

export function partyLabel(party: string | null | undefined): string {
  if (!party) return "Unknown party";
  return PARTY_LABELS[party] ?? party;
}

export function positionLabel(position: string): string {
  const labels: Record<string, string> = {
    YEA: "Yes",
    NAY: "No",
    PRESENT: "Present",
    NOT_VOTING: "Didn't vote",
  };
  return labels[position] ?? position;
}

/** "Texas, District 2", "Wyoming, At Large", or "Wyoming" for a senator. */
export function seatLabel(
  stateName: string,
  districtCode: string | null | undefined,
  chamberKind: "UPPER" | "LOWER" | "UNICAMERAL",
): string {
  if (chamberKind === "UPPER" || !districtCode || districtCode === "STATE") return stateName;
  return districtCode === "AL"
    ? `${stateName}, At Large`
    : `${stateName}, District ${districtCode}`;
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    SENATOR: "Senator",
    REPRESENTATIVE: "Representative",
    DELEGATE: "Delegate",
    RESIDENT_COMMISSIONER: "Resident Commissioner",
    LEGISLATOR: "Legislator",
  };
  return labels[role] ?? role;
}

/** Senate votes come from a dataset that can lag, so people need to see how recent it is. */
export function isStale(asOf: Date | null | undefined, days: number, now = new Date()): boolean {
  if (!asOf) return true;
  return now.getTime() - asOf.getTime() > days * 24 * 60 * 60 * 1000;
}
