// The states and cities we cover, as data. Pages and components take one of these, so adding a state is
// its pipelines plus an entry here, and nothing on screen names a state itself. Pure: no database access.

export type ChamberKind = "UPPER" | "LOWER";

export type CityConfig = {
  /** In URLs: /state/ia/city/des-moines */
  key: string;
  name: string;
  jurisdiction: string;
  /** The Census's ID for the place, which is how a location lookup tells us who lives there. */
  placeGeoid: string;
  /** What the city's data covers so far, said plainly on its page. */
  coverage: string;
  council: {
    name: string;
    /** Wards with their own member. Everyone also has the at-large members and the mayor. */
    wards: number;
  };
  /** The city's own rules for speaking at a regular meeting, from the page that states them. */
  requestToSpeak: {
    url: string;
    rulesUrl: string;
    /** Requests open this many days before the meeting. */
    opensDaysBefore: number;
    /** And close at this local time on the day before. */
    closesDayBeforeAt: { hour: number; minute: number };
    maxSpeakers: number;
    minutesEach: number;
  };
  /** When the agenda goes up: this local time, this many days before the meeting. */
  agendaPosted: { daysBefore: number; hour: number; minute: number };
  meetingsUrl: string;
  /** The city's own tool for finding your ward, because it doesn't publish the boundaries. */
  wardFinderUrl: string;
  /** The ID scheme its officials carry in person_identifier. Their pages use it. */
  personScheme: string;
  /** What each role does, in a sentence, from how the city describes itself. */
  roles: { MAYOR: string; AT_LARGE: string; WARD: string };
  /** The city's own forms for things people ask of a role, like a proclamation from the mayor. */
  roleLinks: Partial<Record<"MAYOR" | "COUNCIL_MEMBER", { label: string; url: string }[]>>;
};

export type StateConfig = {
  /** In URLs and bill slugs: /state/ia, ia-91-hf-1 */
  key: string;
  regionCode: string;
  name: string;
  jurisdiction: string;
  /** Mid-sentence: "the Iowa Legislature hasn't finished with this one." */
  legislature: string;
  chambers: Record<ChamberKind, { name: string; seats: number }>;
  /** The ID scheme its legislators carry in person_identifier. */
  personScheme: string;
  timeZone: string;
  /** The next session's first day, and where that date comes from. */
  nextSession: Date;
  sourceName: string;
  sourceSite: string;
  /** Where voter registration and polling places live. We link to it, never reward using it. */
  electionsUrl: string;
  electionsOffice: string;
  /** How its bills are numbered, for search hints: "HF 100". */
  billExample: string;
  /** A history line saying a chamber passed the bill, with the vote's totals. */
  passageAction: RegExp;
  cities: CityConfig[];
};

export const STATES: StateConfig[] = [
  {
    key: "ia",
    regionCode: "IA",
    name: "Iowa",
    jurisdiction: "US-IA",
    legislature: "the Iowa Legislature",
    chambers: { LOWER: { name: "House", seats: 100 }, UPPER: { name: "Senate", seats: 50 } },
    personScheme: "iowa_legis",
    timeZone: "America/Chicago",
    // The Legislature's own list gives the 91st General Assembly's last day as January 10, 2027.
    nextSession: new Date("2027-01-11T06:00:00.000Z"),
    sourceName: "the Iowa Legislature",
    sourceSite: "legis.iowa.gov",
    electionsUrl: "https://sos.iowa.gov",
    electionsOffice: "Iowa Secretary of State",
    billExample: "HF 100",
    passageAction: /\bpassed (house|senate), yeas \d+/i,
    cities: [
      {
        key: "des-moines",
        name: "Des Moines",
        jurisdiction: "US-IA-DSM",
        placeGeoid: "1921000",
        coverage:
          "The mayor and council, the meeting schedule, and past agendas, minutes, and recordings, from the city's own site. Agendas since August are on a site that doesn't allow automated reading, so for those, follow the link to the city. How each member voted isn't here yet.",
        council: { name: "City Council", wards: 4 },
        // From the city's meeting schedule page, read on November 8, 2026.
        requestToSpeak: {
          url: "https://desmoines.rja.revize.com/forms/401",
          rulesUrl: "https://www.dsm.city/government/city_council/meetings/meeting_schedule.php",
          opensDaysBefore: 10,
          closesDayBeforeAt: { hour: 17, minute: 0 },
          maxSpeakers: 20,
          minutesEach: 5,
        },
        // "Agendas are available to the public by 4 p.m. on the Thursday preceding the meeting." Meetings are Mondays.
        agendaPosted: { daysBefore: 4, hour: 16, minute: 0 },
        meetingsUrl: "https://www.dsm.city/government/city_council/meetings/index.php",
        wardFinderUrl: "https://showmemyhouse.dsm.city/",
        personScheme: "dsm_official",
        // The council page: a Council-Manager government, where voters elect the mayor, two at-large
        // members, and one member for each ward, and the council appoints a City Manager. The minutes
        // list the mayor on every roll call, so the mayor votes like the others.
        roles: {
          MAYOR: "Elected by the whole city. Chairs City Council meetings, and votes on each item like every other member.",
          AT_LARGE: "Elected by the whole city, so they represent everyone in Des Moines.",
          WARD: "Elected by one ward, and the council member who's only that ward's.",
        },
        roleLinks: {
          MAYOR: [
            { label: "Request a proclamation", url: "https://desmoines.rja.revize.com/forms/408" },
            {
              label: "Request a mayor appearance",
              url: "https://forms.office.com/Pages/ResponsePage.aspx?id=yvTRtZprxkGF4e2PSYpaNT28pA8N1TNPlBdNH6gHi1RUMUVDQk0zNFdaTkcxS1FQM0tIMkwxOE5ROC4u",
            },
          ],
        },
      },
    ],
  },
];

export function stateByKey(key: string | null | undefined): StateConfig | null {
  return STATES.find((state) => state.key === key?.toLowerCase()) ?? null;
}

export function stateByRegion(regionCode: string | null | undefined): StateConfig | null {
  return STATES.find((state) => state.regionCode === regionCode?.toUpperCase()) ?? null;
}

/** "ia-91-hf-100" belongs to Iowa. A federal slug starts with "us", which isn't a state. */
export function stateOfSlug(slug: string): StateConfig | null {
  return stateByKey(slug.split("-", 1)[0]);
}

/** A state or one of its cities. */
export function stateOfJurisdiction(code: string): StateConfig | null {
  return STATES.find((state) => state.jurisdiction === code || state.cities.some((city) => city.jurisdiction === code)) ?? null;
}

export function stateOfScheme(scheme: string): StateConfig | null {
  return STATES.find((state) => state.personScheme === scheme) ?? null;
}

export function cityByKey(state: StateConfig, key: string): CityConfig | null {
  return state.cities.find((city) => city.key === key) ?? null;
}

export function cityByGeoid(state: StateConfig, placeGeoid: string | null | undefined): CityConfig | null {
  return state.cities.find((city) => city.placeGeoid === placeGeoid) ?? null;
}

/** What a client component may receive. A RegExp or a function can't cross to the browser. */
export type ClientState = Pick<StateConfig, "key" | "name" | "chambers"> & {
  cities: (Pick<CityConfig, "key" | "name" | "wardFinderUrl"> & { wards: number })[];
};

export function toClientState(state: StateConfig): ClientState {
  return {
    key: state.key,
    name: state.name,
    chambers: state.chambers,
    cities: state.cities.map(({ key, name, wardFinderUrl, council }) => ({ key, name, wardFinderUrl, wards: council.wards })),
  };
}

/** "Iowa House" */
export function chamberName(state: Pick<StateConfig, "name" | "chambers">, kind: ChamberKind): string {
  return `${state.name} ${state.chambers[kind].name}`;
}

/** Every jurisdiction whose meetings belong on a state's pages: the state's, and its cities'. */
export function eventJurisdictions(state: StateConfig): string[] {
  return [state.jurisdiction, ...state.cities.map((city) => city.jurisdiction)];
}

export function sessionHasStarted(state: StateConfig, now = new Date()): boolean {
  return now.getTime() >= state.nextSession.getTime();
}

export function nextSessionText(state: StateConfig): string {
  return state.nextSession.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: state.timeZone });
}

/** Keeps a district number inside the chamber's real range. */
export function validDistrict(state: StateConfig, kind: ChamberKind, value: string | null | undefined): string | null {
  if (!value) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= state.chambers[kind].seats ? String(number) : null;
}
