import { seatLabel } from "@/lib/civic/labels";
import { chamberName, stateByKey } from "@/lib/civic/states";
import { stateName } from "./state-name";

type Term = { regionCode: string | null; district?: { code: string } | null; chamber: { kind: string; shortName?: string } };

/** "Texas, District 2" for Congress. "Iowa Senate, District 18" for a statehouse, where senators have districts too. */
export function seatOf(term: Term, memberKey: string | null): string {
  const state = stateByKey(memberKey?.match(/^([a-z]{2}):/)?.[1]);
  if (state) {
    const chamber = chamberName(state, term.chamber.kind === "UPPER" ? "UPPER" : "LOWER");
    return `${chamber}${term.district ? `, District ${term.district.code}` : ""}`;
  }
  return seatLabel(stateName(term.regionCode ?? ""), term.district?.code, term.chamber.kind as "UPPER" | "LOWER" | "UNICAMERAL");
}
