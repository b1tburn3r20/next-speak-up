// What gets sent, when, and what it says. Pure logic, plus the sender with the database and push stubbed.
import { describe, expect, it } from "vitest";
import { isPushEndpoint } from "@/lib/notifications/endpoint";
import {
  deviceLabel,
  dueReminders,
  floorBillsFor,
  floorWeekDue,
  floorWeekMessage,
  meetingMessage,
  mutedTopicsFrom,
  notifyTopics,
  outcomeWord,
  prefsFrom,
  reminderSendAt,
  theirLegislators,
  voteResultMessage,
  wantsVoteResult,
  type CastVote,
  type FloorBill,
  type UpcomingMeeting,
} from "@/lib/notifications/plan";

const TZ = "America/Chicago";
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
// Wednesday, November 18, 2026, 6:00 PM in Iowa (CST, UTC-6).
const MEETING: UpcomingMeeting = { ref: "event:1", day: day("2026-11-18"), startsAt: new Date("2026-11-19T00:00:00.000Z"), fromSchedule: false };
const at = (iso: string) => new Date(iso);

describe("meeting reminders", () => {
  it("go out a week, two days, and a day ahead at 9 AM, and at 8 AM the day of", () => {
    expect(reminderSendAt(MEETING, "7d", TZ)).toEqual(at("2026-11-11T15:00:00.000Z"));
    expect(reminderSendAt(MEETING, "2d", TZ)).toEqual(at("2026-11-16T15:00:00.000Z"));
    expect(reminderSendAt(MEETING, "1d", TZ)).toEqual(at("2026-11-17T15:00:00.000Z"));
    expect(reminderSendAt(MEETING, "day", TZ)).toEqual(at("2026-11-18T14:00:00.000Z"));
  });

  it("come earlier the day of an early meeting, but never before 6 AM", () => {
    const nine = { ...MEETING, startsAt: at("2026-11-18T15:00:00.000Z") };
    expect(reminderSendAt(nine, "day", TZ)).toEqual(at("2026-11-18T13:00:00.000Z"));
    const seven = { ...MEETING, startsAt: at("2026-11-18T13:00:00.000Z") };
    expect(reminderSendAt(seven, "day", TZ)).toEqual(at("2026-11-18T12:00:00.000Z"));
  });

  it("keep 9 AM local across the end of daylight saving", () => {
    // November 1, 2026 is the change. A meeting on the 3rd has its week-ahead reminder in daylight time.
    const meeting = { ...MEETING, day: day("2026-11-03"), startsAt: at("2026-11-04T00:00:00.000Z") };
    expect(reminderSendAt(meeting, "7d", TZ)).toEqual(at("2026-10-27T14:00:00.000Z"));
    expect(reminderSendAt(meeting, "1d", TZ)).toEqual(at("2026-11-02T15:00:00.000Z"));
  });

  it("are due once their time comes, and later that same day, but never on a later day", () => {
    expect(dueReminders(MEETING, at("2026-11-11T14:59:00.000Z"), TZ)).toEqual([]);
    expect(dueReminders(MEETING, at("2026-11-11T15:00:00.000Z"), TZ)).toEqual(["7d"]);
    // 11 PM that night, still the same local day: catch up.
    expect(dueReminders(MEETING, at("2026-11-12T05:00:00.000Z"), TZ)).toEqual(["7d"]);
    // The next morning, "next Wednesday" would be wrong, so nothing.
    expect(dueReminders(MEETING, at("2026-11-12T15:00:00.000Z"), TZ)).toEqual([]);
    expect(dueReminders(MEETING, at("2026-11-18T20:00:00.000Z"), TZ)).toEqual(["day"]);
  });

  it("stop once the meeting starts", () => {
    expect(dueReminders(MEETING, at("2026-11-19T00:00:00.000Z"), TZ)).toEqual([]);
  });

  it("work for a day with no time, through the end of that day", () => {
    const dateOnly = { ...MEETING, startsAt: null };
    expect(dueReminders(dateOnly, at("2026-11-18T23:00:00.000Z"), TZ)).toEqual(["day"]);
    expect(dueReminders(dateOnly, at("2026-11-19T15:00:00.000Z"), TZ)).toEqual([]);
  });

  it("say when, in plain words", () => {
    const base = { cityName: "Pella", meeting: MEETING, title: "Regular Council Meeting", url: "/state/ia/city/pella/meetings/1" };
    expect(meetingMessage({ ...base, slot: "7d" }, TZ).title).toBe("Pella City Council meets next Wednesday");
    expect(meetingMessage({ ...base, slot: "7d" }, TZ).body).toBe("Wednesday, November 18 at 6:00 PM. Regular Council Meeting.");
    expect(meetingMessage({ ...base, slot: "2d" }, TZ).title).toBe("Pella City Council meets Wednesday");
    expect(meetingMessage({ ...base, slot: "1d" }, TZ).title).toBe("Pella City Council meets tomorrow");
    expect(meetingMessage({ ...base, slot: "1d", speakUrl: "https://x" }, TZ).body).toContain("Want to speak?");
    expect(meetingMessage({ ...base, slot: "day" }, TZ).title).toBe("Pella City Council meets today at 6:00 PM");
  });

  it("say a meeting from the schedule is only what usually happens", () => {
    const scheduled = { ...MEETING, ref: "sched:1962220:2026-11-18", fromSchedule: true };
    const message = meetingMessage({ cityName: "Otho", meeting: scheduled, slot: "2d", title: null, url: "/x", phone: "(515) 555-0100" }, TZ);
    expect(message.title).toBe("Otho City Council usually meets Wednesday");
    expect(message.body).toContain("Call City Hall at (515) 555-0100");
  });
});

describe("the weekly floor note", () => {
  it("is due Mondays from 9 AM where the person lives", () => {
    expect(floorWeekDue(at("2026-11-09T14:59:00.000Z"), TZ)).toBeNull();
    expect(floorWeekDue(at("2026-11-09T15:00:00.000Z"), TZ)).toBe("2026-11-09");
    expect(floorWeekDue(at("2026-11-10T15:00:00.000Z"), TZ)).toBeNull();
    // 9 AM in New York is an hour earlier.
    expect(floorWeekDue(at("2026-11-09T14:00:00.000Z"), "America/New_York")).toBe("2026-11-09");
  });

  const bills: FloorBill[] = [
    { billId: 1, slug: "us-119-s-5", label: "S. 5", title: "A Senate health bill", policyArea: "Health", chamber: "UPPER" },
    { billId: 2, slug: "us-119-hr-9", label: "H.R. 9", title: "A House health bill", policyArea: "Health", chamber: "LOWER" },
    { billId: 2, slug: "us-119-hr-9", label: "H.R. 9", title: "A House health bill", policyArea: "Health", chamber: "LOWER" },
    { billId: 3, slug: "us-119-hr-3", label: "H.R. 3", title: "A tax bill", policyArea: "Taxation", chamber: "LOWER" },
  ];

  it("keeps only someone's topics, once each, House first", () => {
    expect(floorBillsFor(bills, new Set(["Health"])).map((bill) => bill.billId)).toEqual([2, 1]);
    expect(floorBillsFor(bills, new Set(["Energy"]))).toEqual([]);
  });

  it("says 'may come up', never that a vote will happen", () => {
    const message = floorWeekMessage(floorBillsFor(bills, new Set(["Health"])), "/federal/upcoming");
    expect(message?.title).toBe("2 Health bills may come up for a vote this week");
    expect(message?.body).toContain("H.R. 9: A House health bill");
    expect(message?.title).not.toMatch(/will/);
    expect(floorWeekMessage([], "/x")).toBeNull();
  });
});

describe("vote results", () => {
  const votes: CastVote[] = [
    { personId: 1, name: "Zach Nunn", position: "YEA", districtId: 30, regionCode: "IA" },
    { personId: 2, name: "Joni Ernst", position: "NAY", districtId: null, regionCode: "IA" },
    { personId: 3, name: "Chuck Grassley", position: "YEA", districtId: null, regionCode: "IA" },
    { personId: 4, name: "Someone Else", position: "YEA", districtId: 31, regionCode: "IA" },
  ];

  it("find someone's own legislators: a district's member, or a state's two U.S. senators", () => {
    const place = { regionCode: "IA", districtId: 30, upperDistrictId: 77 };
    expect(theirLegislators(votes, place, "LOWER", true).map((vote) => vote.name)).toEqual(["Zach Nunn"]);
    expect(theirLegislators(votes.slice(1, 3), place, "UPPER", true).map((vote) => vote.name)).toEqual(["Joni Ernst", "Chuck Grassley"]);
    // A state senator has a district.
    expect(theirLegislators([{ ...votes[3], districtId: 77 }], place, "UPPER", false)).toHaveLength(1);
    expect(theirLegislators(votes, null, "LOWER", true)).toEqual([]);
  });

  it("read the source's result plainly", () => {
    expect(outcomeWord("Passed")).toBe("passed");
    expect(outcomeWord("Agreed to")).toBe("passed");
    expect(outcomeWord("Failed")).toBe("rejected");
    expect(outcomeWord("Not Agreed to")).toBe("rejected");
    expect(outcomeWord(null)).toBe("voted on");
  });

  it("say how it went and how their rep voted, compared with them", () => {
    const base = { chamberName: "The House", label: "H.R. 123", result: "Passed", yea: 230, nay: 190, url: "/federal/bills/us-119-hr-123" };
    const same = voteResultMessage({ ...base, legislators: [votes[0]], mine: "YEA" });
    expect(same.title).toBe("The House passed H.R. 123");
    expect(same.body).toBe("230 to 190. Zach Nunn voted Support, the same as you.");
    const differ = voteResultMessage({ ...base, legislators: [votes[0]], mine: "NAY" });
    expect(differ.body).toContain("and you opposed it");
    const notVoted = voteResultMessage({ ...base, legislators: [votes[0]], mine: null });
    expect(notVoted.body).toContain("Vote too");
    const senate = voteResultMessage({ ...base, chamberName: "The Senate", legislators: votes.slice(1, 3), mine: null });
    expect(senate.body).toContain("Yours: Joni Ernst Oppose, Chuck Grassley Support.");
  });
});

describe("choices", () => {
  it("are all on until turned off", () => {
    expect(prefsFrom([])).toEqual({ cityMeetings: true, floorWeek: true, voteResults: true, votedBills: true, topicResults: true, becameLaw: true });
    expect(prefsFrom([{ key: "notify.floorWeek", value: "false" }]).floorWeek).toBe(false);
  });

  it("send a result only for a reason whose own switch is on", () => {
    const all = { prefs: prefsFrom([]), mutedTopics: [] };
    const none = { follows: false, voted: false, scheduledInTopic: false, policyArea: "Health" };
    expect(wantsVoteResult(all, { ...none, follows: true })).toBe(true);
    expect(wantsVoteResult(all, none)).toBe(false);
    const noVoted = { ...all, prefs: { ...all.prefs, votedBills: false } };
    expect(wantsVoteResult(noVoted, { ...none, voted: true })).toBe(false);
    // Another reason still counts.
    expect(wantsVoteResult(noVoted, { ...none, voted: true, follows: true })).toBe(true);
    expect(wantsVoteResult(all, { ...none, scheduledInTopic: true })).toBe(true);
    expect(wantsVoteResult({ ...all, mutedTopics: ["Health"] }, { ...none, scheduledInTopic: true })).toBe(false);
    expect(wantsVoteResult({ ...all, prefs: { ...all.prefs, topicResults: false } }, { ...none, scheduledInTopic: true })).toBe(false);
  });

  it("can mute one topic without untracking it", () => {
    const rows = [
      { key: "notify.topicOff:Health", value: "true" },
      { key: "notify.topicOff:Taxation", value: "false" },
      { key: "notify.floorWeek", value: "true" },
    ];
    expect(mutedTopicsFrom(rows)).toEqual(["Health"]);
    expect([...notifyTopics(["Health", "Taxation", "Energy"], mutedTopicsFrom(rows))]).toEqual(["Taxation", "Energy"]);
  });

  it("name devices so they can be told apart", () => {
    expect(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36")).toBe("Chrome on Windows");
    expect(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0")).toBe("Edge on Windows");
    expect(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe("Safari on iPhone");
    expect(deviceLabel("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36")).toBe("Chrome on Android");
    expect(deviceLabel(null)).toBe("A browser");
  });
});

describe("push addresses", () => {
  it("are only the browsers' own push services", () => {
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true);
    expect(isPushEndpoint("https://web.push.apple.com/abc")).toBe(true);
    expect(isPushEndpoint("https://wns2-bl2p.notify.windows.com/w/?token=abc")).toBe(true);
    expect(isPushEndpoint("http://fcm.googleapis.com/fcm/send/abc")).toBe(false);
    expect(isPushEndpoint("https://evil.example/fcm.googleapis.com")).toBe(false);
    expect(isPushEndpoint("https://fcm.googleapis.com.evil.example/x")).toBe(false);
    expect(isPushEndpoint("https://127.0.0.1/x")).toBe(false);
    expect(isPushEndpoint("not a url")).toBe(false);
  });
});
