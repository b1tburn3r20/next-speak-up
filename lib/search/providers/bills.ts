import { parseBillSearch } from "@/lib/civic/bills";
import { billLabel, BILL_STATUS_LABELS, type BillStatusValue } from "@/lib/civic/labels";
import { billPath } from "@/lib/routes";
import prisma from "@/prisma/client";
import { commandScore, rankResults, scoreFields } from "../score";
import type { SearchProvider } from "../types";

const CANDIDATES = 40;
const SELECT = {
  id: true,
  slug: true,
  billType: true,
  number: true,
  title: true,
  policyArea: true,
  currentStatus: true,
} as const;

/** MySQL's word search, as "every word, allowing it to continue": "+clean* +water*". */
function fullTextQuery(query: string): string | null {
  const words = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    // Shorter words aren't in the index.
    .filter((word) => word.length >= 3);
  return words.length > 0 ? words.map((word) => `+${word}*`).join(" ") : null;
}

async function candidateIds(query: string): Promise<number[]> {
  const words = fullTextQuery(query);
  if (words) {
    const rows = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM bill
      WHERE MATCH(title) AGAINST (${words} IN BOOLEAN MODE)
      ORDER BY MATCH(title) AGAINST (${words} IN BOOLEAN MODE) DESC, latestActionDate DESC
      LIMIT ${CANDIDATES}`;
    if (rows.length > 0) return rows.map((row) => Number(row.id));
  }
  return [];
}

export const billsProvider: SearchProvider = {
  id: "bills",
  label: "Bills",
  minQueryLength: 2,
  search: async ({ query, limit }) => {
    const citation = parseBillSearch(query);
    const [ids, citedBills] = await Promise.all([
      candidateIds(query),
      citation
        ? prisma.bill.findMany({
            where: {
              number: citation.number,
              ...(citation.billType ? { billType: citation.billType } : {}),
            },
            orderBy: { latestActionDate: { sort: "desc", nulls: "last" } },
            take: 10,
            select: SELECT,
          })
        : [],
    ]);
    const found = await prisma.bill.findMany({ where: { id: { in: ids } }, select: SELECT });
    // Word search keeps its own ranking as the tie-break.
    const order = new Map(ids.map((id, index) => [id, index]));
    found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    const bills = [...new Map([...citedBills, ...found].map((bill) => [bill.id, bill])).values()];
    return rankResults(
      bills.map((bill) => {
        const label = billLabel(bill.billType, bill.number);
        return {
          id: bill.slug,
          badge: label,
          title: bill.title,
          subtitle: BILL_STATUS_LABELS[bill.currentStatus as BillStatusValue],
          href: billPath(bill.slug),
          policyArea: bill.policyArea,
          score: Math.max(
            commandScore(query, label),
            scoreFields(query, [{ text: bill.title }, { text: bill.policyArea, weight: 0.8 }]),
            // Word search found it for a reason, even if the title's words are far apart.
            0.3,
          ),
        };
      }),
      limit,
    );
  },
};
