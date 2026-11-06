// Plain explanations of legislative terms. These must stay accurate: when a simple version would
// mislead, say less rather than something wrong.

export type GlossaryEntry = { term: string; short: string; more?: string };

export const GLOSSARY: Record<string, GlossaryEntry> = {
  bill: {
    term: "Bill",
    short: "A proposed law. Both chambers must pass it, and then the President signs or vetoes it.",
  },
  resolution: {
    term: "Resolution",
    short: "A measure one chamber votes on alone, usually about its own rules or opinions. It doesn't become law.",
  },
  "joint-resolution": {
    term: "Joint resolution",
    short: "Works much like a bill: it can become law. Proposed constitutional amendments use this form too, and those go to the states instead of the President.",
  },
  "concurrent-resolution": {
    term: "Concurrent resolution",
    short: "Passed by both chambers, but it isn't a law and doesn't go to the President. Congress uses it for its own business, like budget plans.",
  },
  sponsor: {
    term: "Sponsor",
    short: "The member of Congress who formally introduced the bill.",
  },
  cosponsor: {
    term: "Cosponsor",
    short: "A member who adds their name to show they support a bill. It isn't a vote.",
  },
  committee: {
    term: "Committee",
    short: "A smaller group of members that studies bills on one subject. Most bills never get past this stage.",
  },
  referred: {
    term: "Referred to committee",
    short: "The bill was sent to a committee to study. This happens to nearly every bill right after it's introduced.",
  },
  reported: {
    term: "Reported",
    short: "The committee finished with the bill and sent it to the full chamber, usually with a recommendation.",
  },
  markup: {
    term: "Markup",
    short: "The meeting where a committee debates a bill and changes its wording.",
  },
  floor: {
    term: "The floor",
    short: "The full House or Senate, where all members can debate and vote.",
  },
  "suspension-of-the-rules": {
    term: "Suspension of the rules",
    short: "A fast track in the House: debate is limited to 40 minutes, no amendments are allowed, and it takes two-thirds to pass. It's mostly used for bills without much opposition.",
  },
  rule: {
    term: "A rule",
    short: "In the House, a resolution that sets the terms of debate for a bill: how long it lasts, and which amendments are allowed. The House votes on the rule first.",
  },
  "previous-question": {
    term: "Previous question",
    short: "A House vote to end debate and move to a final vote. It's procedural, so it isn't a vote on the bill itself.",
  },
  recommit: {
    term: "Motion to recommit",
    short: "A last attempt to send a bill back to committee, usually by the minority party. Often it's a way to force a vote on a change.",
  },
  cloture: {
    term: "Cloture",
    short: "How the Senate ends debate. It takes 60 votes for most matters, which makes this a common way for a minority of senators to block something.",
  },
  filibuster: {
    term: "Filibuster",
    short: "Using the Senate's long debate rules to delay or block a vote. Ending it requires cloture.",
  },
  "unanimous-consent": {
    term: "Unanimous consent",
    short: "Passing something with no recorded vote, because no member present objects.",
  },
  "voice-vote": {
    term: "Voice vote",
    short: "Members call out yes or no together, and the presiding officer decides which side won. No one's individual vote is recorded.",
  },
  "roll-call": {
    term: "Roll call vote",
    short: "A vote where each member's position is recorded. These are the votes we can compare with yours.",
  },
  quorum: {
    term: "Quorum",
    short: "The minimum number of members who must be present to do business, which is usually a majority.",
  },
  amendment: {
    term: "Amendment",
    short: "A proposed change to a bill's text. A vote on an amendment isn't a vote on the whole bill.",
  },
  engrossed: {
    term: "Engrossed",
    short: "The official copy of a bill after one chamber passes it.",
  },
  enrolled: {
    term: "Enrolled",
    short: "The final version, after both chambers pass identical text. It's the copy sent to the President.",
  },
  concur: {
    term: "Concur",
    short: "To agree. When one chamber changes a bill, the other can concur and accept those changes.",
  },
  conference: {
    term: "Conference report",
    short: "A compromise version negotiated by members of both chambers when they've passed different text.",
  },
  veto: {
    term: "Veto",
    short: "When the President rejects a bill. Congress can override that with a two-thirds vote in both chambers.",
  },
  "pocket-veto": {
    term: "Pocket veto",
    short: "When Congress adjourns and the President doesn't sign a bill within 10 days, so it dies without a formal veto.",
  },
  "public-law": {
    term: "Public law",
    short: "A bill that has been enacted. It's numbered by Congress: 119-87 is the 87th law of the 119th Congress.",
  },
  crs: {
    term: "CRS summary",
    short: "A neutral summary written by the Congressional Research Service, Congress's nonpartisan research staff.",
  },
  party: {
    term: "Voting with party",
    short: "How often a member voted the same way as most of their party, on recorded yes-or-no votes.",
  },
};

export function glossaryEntry(key: string): GlossaryEntry | null {
  return GLOSSARY[key] ?? null;
}

/** Which term explains a House floor category. */
export const FLOOR_CATEGORY_TERMS: Record<string, string> = {
  SUSPENSION: "suspension-of-the-rules",
  RULE: "rule",
};

/**
 * What a bill action means, in plain words. Only for wording we're sure about. Anything else
 * returns null, and the official text is shown alone.
 */
export function explainAction(text: string): { explanation: string; term?: string } | null {
  const rules: [RegExp, string, string?][] = [
    [/^became (public|private) law/i, "It's now the law.", "public-law"],
    [/^signed by president/i, "The President signed it.", undefined],
    [/^presented to president/i, "Congress sent it to the President to sign or veto.", "veto"],
    [/^vetoed by president/i, "The President rejected it.", "veto"],
    [/^pocket vetoed/i, "It died without the President's signature.", "pocket-veto"],
    [/^(introduced in|sponsor introductory)/i, "A member formally proposed it.", "sponsor"],
    [/^(referred to|read twice and referred)/i, "Sent to a committee to study.", "referred"],
    [/^(ordered to be )?reported/i, "The committee sent it on to the full chamber.", "reported"],
    [/^placed on .*calendar/i, "It's now eligible for floor time, though that doesn't mean a vote is scheduled.", "floor"],
    [/suspend the rules/i, "A fast-track vote that needs two-thirds to pass.", "suspension-of-the-rules"],
    [/^(passed|on passage).*by unanimous consent/i, "It passed with no recorded vote, because no one objected.", "unanimous-consent"],
    [/by voice vote/i, "Decided by voice, so individual votes weren't recorded.", "voice-vote"],
    [/^passed\/agreed to in house/i, "The House passed it.", undefined],
    [/^passed\/agreed to in senate/i, "The Senate passed it.", undefined],
    [/^failed/i, "The vote didn't pass.", undefined],
    [/cloture/i, "A Senate vote about ending debate.", "cloture"],
    [/^received in the (house|senate)/i, "It arrived from the other chamber.", undefined],
    [/^held at the desk/i, "Kept ready for floor action, instead of going to a committee.", undefined],
    [/motion to reconsider laid on the table/i, "A routine step that makes the vote final.", undefined],
    [/^message on senate action/i, "The Senate told the House what it did.", undefined],
    [/^resolving differences/i, "The chambers are working out the differences in their versions.", "concur"],
    [/previous question/i, "A procedural vote to end debate.", "previous-question"],
  ];
  for (const [pattern, explanation, term] of rules) {
    if (pattern.test(text)) return { explanation, term };
  }
  return null;
}
