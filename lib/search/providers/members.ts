import { seatOf } from "@/components/people/seat";
import { stateName } from "@/components/people/state-name";
import { partyLabel, roleLabel, seatLabel } from "@/lib/civic/labels";
import { memberKeyOf, listCurrentMembers } from "@/lib/civic/people";
import { memberPath } from "@/lib/routes";
import { rankResults, scoreFields } from "../score";
import type { SearchProvider, SearchResult } from "../types";

// Congress changes rarely, and scoring every member in memory is what lets a typo still match.
const ROSTER_TTL_MS = 10 * 60 * 1000;
type Roster = { loadedAt: number; members: Awaited<ReturnType<typeof listCurrentMembers>> };
const rosters = new Map<string, Roster>();

async function getRoster(jurisdiction: string) {
  const roster = rosters.get(jurisdiction);
  if (roster && Date.now() - roster.loadedAt <= ROSTER_TTL_MS) return roster.members;
  const members = await listCurrentMembers({ jurisdiction });
  rosters.set(jurisdiction, { loadedAt: Date.now(), members });
  return members;
}

function searchChamber(chamber: "UPPER" | "LOWER") {
  return async ({ query, limit }: { query: string; limit: number }): Promise<SearchResult[]> => {
    const members = await getRoster("US");
    const results = members.flatMap((member) => {
      const term = member.terms[0];
      const bioguide = memberKeyOf(member);
      if (!term || !bioguide || term.chamber.kind !== chamber) return [];
      const state = stateName(term.regionCode);
      const seat = seatLabel(state, term.district?.code, term.chamber.kind);
      return [
        {
          id: bioguide,
          title: member.fullName,
          subtitle: `${roleLabel(term.role)}, ${seat} · ${partyLabel(term.party)}`,
          href: memberPath(bioguide),
          person: { name: member.fullName, imageUrl: member.imageUrl, party: term.party },
          score: scoreFields(query, [
            { text: member.fullName },
            { text: `${state} ${term.regionCode}`, weight: 0.75 },
            { text: seat, weight: 0.7 },
            { text: partyLabel(term.party), weight: 0.5 },
          ]),
        },
      ];
    });
    return rankResults(results, limit);
  };
}

export const representativesProvider: SearchProvider = {
  id: "representatives",
  label: "Representatives",
  minQueryLength: 2,
  search: searchChamber("LOWER"),
};

export const senatorsProvider: SearchProvider = {
  id: "senators",
  label: "Senators",
  minQueryLength: 2,
  search: searchChamber("UPPER"),
};

export const iowaLegislatorsProvider: SearchProvider = {
  id: "iowa-legislators",
  label: "Iowa legislators",
  minQueryLength: 2,
  search: async ({ query, limit }) => {
    const members = await getRoster("US-IA");
    const results = members.flatMap((member) => {
      const term = member.terms[0];
      const key = memberKeyOf(member);
      if (!term || !key) return [];
      const seat = seatOf(term, key);
      return [
        {
          id: key,
          title: member.fullName,
          subtitle: `${seat} · ${partyLabel(term.party)}`,
          href: memberPath(key),
          person: { name: member.fullName, imageUrl: member.imageUrl, party: term.party },
          score: scoreFields(query, [
            { text: member.fullName },
            { text: seat, weight: 0.7 },
            { text: partyLabel(term.party), weight: 0.5 },
          ]),
        },
      ];
    });
    return rankResults(results, limit);
  },
};
