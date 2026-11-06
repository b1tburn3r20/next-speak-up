// Pure logic for a member's legislative record. No database access here, so it's easy to test.

type SponsoredBill = { policyArea: string | null; currentStatus: string };

const ENACTED = new Set(["BECAME_LAW", "VETO_OVERRIDDEN", "SIGNED"]);
const PAST_COMMITTEE = new Set([
  "REPORTED",
  "PASSED_ORIGIN_CHAMBER",
  "PASSED_BOTH_CHAMBERS",
  "AGREED_TO",
  "RESOLVING_DIFFERENCES",
  "TO_EXECUTIVE",
  "VETOED",
]);

export type LegislativeRecord = {
  sponsored: number;
  advanced: number;
  becameLaw: number;
  /** Null when there's nothing to divide by, so the page can say "no data" instead of 0%. */
  lawPercent: number | null;
  byPolicyArea: { policyArea: string; count: number; percent: number }[];
};

/** How far a member's sponsored bills got, and what they were about. Top 8 areas. */
export function summarizeSponsoredBills(bills: SponsoredBill[]): LegislativeRecord {
  const becameLaw = bills.filter((bill) => ENACTED.has(bill.currentStatus)).length;
  const advanced =
    becameLaw + bills.filter((bill) => PAST_COMMITTEE.has(bill.currentStatus)).length;
  const counts = new Map<string, number>();
  for (const bill of bills) {
    if (bill.policyArea) counts.set(bill.policyArea, (counts.get(bill.policyArea) ?? 0) + 1);
  }
  const labelled = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return {
    sponsored: bills.length,
    advanced,
    becameLaw,
    lawPercent: bills.length === 0 ? null : Math.round((becameLaw / bills.length) * 100),
    byPolicyArea: [...counts.entries()]
      .map(([policyArea, count]) => ({
        policyArea,
        count,
        percent: Math.round((count / labelled) * 100),
      }))
      .sort((a, b) => b.count - a.count || a.policyArea.localeCompare(b.policyArea))
      .slice(0, 8),
  };
}
