/**
 * Functions to calculate time until re-election for Congress members
 */

export interface TimeUntilReelection {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  nextElectionDate: Date;
}

/**
 * Calculates the next Senate election date for a given senator
 * Senators serve 6-year terms, with elections staggered across 3 classes
 */
export function getNextSenateElection(
  lastElectionYear: number,
  senatorClass: 1 | 2 | 3
): Date {
  const currentYear = new Date().getFullYear();

  // Senate classes and their election years (based on the pattern)
  // Class 1: 2024, 2030, 2036... (years divisible by 6, remainder 0 when divided by 6, offset by 2024)
  // Class 2: 2026, 2032, 2038... (years divisible by 6, remainder 2 when divided by 6, offset by 2026)
  // Class 3: 2028, 2034, 2040... (years divisible by 6, remainder 4 when divided by 6, offset by 2028)

  let nextElectionYear: number;

  switch (senatorClass) {
    case 1:
      // Next Class 1 election after current year
      nextElectionYear = Math.ceil((currentYear - 2024) / 6) * 6 + 2024;
      if (nextElectionYear <= currentYear) {
        nextElectionYear += 6;
      }
      break;
    case 2:
      // Next Class 2 election after current year
      nextElectionYear = Math.ceil((currentYear - 2026) / 6) * 6 + 2026;
      if (nextElectionYear <= currentYear) {
        nextElectionYear += 6;
      }
      break;
    case 3:
      // Next Class 3 election after current year
      nextElectionYear = Math.ceil((currentYear - 2028) / 6) * 6 + 2028;
      if (nextElectionYear <= currentYear) {
        nextElectionYear += 6;
      }
      break;
    default:
      throw new Error("Invalid senator class. Must be 1, 2, or 3.");
  }

  // Elections are held on the first Tuesday after the first Monday in November
  return getElectionDate(nextElectionYear);
}

/**
 * Calculates the next House election date
 * House members serve 2-year terms with elections every even year
 */
export function getNextHouseElection(): Date {
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();

  // House elections are every even year
  let nextElectionYear = currentYear;

  // If current year is odd, next election is next year
  // If current year is even, check if election has already passed
  if (currentYear % 2 === 1) {
    nextElectionYear = currentYear + 1;
  } else {
    const thisYearElection = getElectionDate(currentYear);
    if (currentDate > thisYearElection) {
      nextElectionYear = currentYear + 2;
    }
  }

  return getElectionDate(nextElectionYear);
}

/**
 * Helper function to get the election date for a given year
 * Elections are held on the first Tuesday after the first Monday in November
 */
function getElectionDate(year: number): Date {
  // Start with November 1st
  const nov1 = new Date(year, 10, 1); // Month is 0-indexed

  // Find the first Monday (day 1 = Monday)
  const dayOfWeek = nov1.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
  const firstMonday = 1 + daysUntilMonday;

  // Election is the Tuesday after the first Monday
  const electionDay = firstMonday + 1;

  return new Date(year, 10, electionDay);
}

/**
 * Calculates time remaining until re-election
 */
export function calculateTimeUntilReelection(
  nextElectionDate: Date
): TimeUntilReelection {
  const now = new Date();
  const diffTime = nextElectionDate.getTime() - now.getTime();
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Calculate years, months, days
  const years = Math.floor(totalDays / 365.25);
  const remainingDaysAfterYears = totalDays - Math.floor(years * 365.25);
  const months = Math.floor(remainingDaysAfterYears / 30.44); // Average month length
  const days = Math.floor(remainingDaysAfterYears - months * 30.44);

  return {
    years,
    months,
    days,
    totalDays,
    nextElectionDate,
  };
}

/**
 * Main function for Senate members
 */
export function getSenateTimeUntilReelection(
  senatorClass: 1 | 2 | 3,
  lastElectionYear?: number
): TimeUntilReelection {
  const nextElection = getNextSenateElection(
    lastElectionYear || 2024,
    senatorClass
  );
  return calculateTimeUntilReelection(nextElection);
}

/**
 * Main function for House members
 */
export function getHouseTimeUntilReelection(): TimeUntilReelection {
  const nextElection = getNextHouseElection();
  return calculateTimeUntilReelection(nextElection);
}

/**
 * Utility function to get reelection info based on congress member data
 */
export function getCongressMemberReelectionInfo(
  congressMember: any // Replace with your ComprehensiveLegislatorData type
): TimeUntilReelection {
  // If has district, it's House
  if (congressMember.district) {
    return getHouseTimeUntilReelection();
  }

  // If no district, it's Senate - you'll need to determine the class
  // This would typically come from your data or you could infer from last election year
  const senatorClass = determineSenatorClass(congressMember);
  return getSenateTimeUntilReelection(senatorClass);
}

/**
 * Helper to determine senator class based on available data
 */
function determineSenatorClass(congressMember: any): 1 | 2 | 3 {
  // Method 1: If you have the last election year in your data
  if (congressMember.lastElectionYear) {
    return getSenatorClassFromElectionYear(congressMember.lastElectionYear);
  }

  // Method 2: If you have CongressTerm data, find their current/most recent Senate term
  if (congressMember.sessions && congressMember.sessions.length > 0) {
    // Find the most recent active Senate term (no endYear or recent endYear)
    const currentYear = new Date().getFullYear();
    const activeSenateTerm = congressMember.sessions
      .filter(
        (term: any) =>
          term.chamber === "Senate" &&
          (!term.endYear || term.endYear >= currentYear - 1) // Still active or recently ended
      )
      .sort((a: any, b: any) => (b.startYear || 0) - (a.startYear || 0))[0];

    if (activeSenateTerm && activeSenateTerm.startYear) {
      // Senate terms start in odd years, elections are in the preceding even year
      // 2021 start → 2020 election → Class 2
      // 2023 start → 2022 election → Class 3
      // 2025 start → 2024 election → Class 1
      const electionYear = activeSenateTerm.startYear - 1;
      return getSenatorClassFromElectionYear(electionYear);
    }
  }

  // Method 3: If you have senator class directly in your data
  if (congressMember.senatorClass) {
    return congressMember.senatorClass;
  }

  // Method 4: Lookup by bioguideId (would need a mapping table)
  if (congressMember.bioguideId) {
    const classFromBioguide = getSenatorClassFromBioguideId(
      congressMember.bioguideId
    );
    if (classFromBioguide) return classFromBioguide;
  }

  // Default fallback - you might want to handle this differently
  console.warn(
    `Could not determine senator class for ${congressMember.firstName} ${congressMember.lastName}, defaulting to Class 2`
  );
  return 2; // Assumes Class 2 (2026 election)
}

/**
 * Determines senator class from election year
 */
function getSenatorClassFromElectionYear(electionYear: number): 1 | 2 | 3 {
  const remainder = electionYear % 6;

  // Class 1: 2018, 2024, 2030... (remainder 0 when subtracting 2024)
  if ((electionYear - 2024) % 6 === 0) return 1;

  // Class 2: 2020, 2026, 2032... (remainder 2 when subtracting 2024)
  if ((electionYear - 2020) % 6 === 0) return 2;

  // Class 3: 2022, 2028, 2034... (remainder 4 when subtracting 2024)
  if ((electionYear - 2022) % 6 === 0) return 3;

  throw new Error(`Invalid election year for senator: ${electionYear}`);
}

/**
 * Optional: Lookup senator class by bioguideId
 * You could populate this with known current senators
 */
function getSenatorClassFromBioguideId(bioguideId: string): 1 | 2 | 3 | null {
  // This would be a lookup table of current senators and their classes
  // You could populate this from an external source or hardcode known values
  const senatorClassMap: Record<string, 1 | 2 | 3> = {
    // Example entries - you'd need to populate this
    // 'S000148': 2, // Chuck Schumer (Class 2, up in 2026)
    // Add more as needed...
  };

  return senatorClassMap[bioguideId] || null;
}

// Usage examples:
/*
// For a specific congress member
const reelectionInfo = getCongressMemberReelectionInfo(congressMember);
console.log(`Up for re-election in: ${reelectionInfo.years} years, ${reelectionInfo.months} months, ${reelectionInfo.days} days`);
console.log(`Next election date: ${reelectionInfo.nextElectionDate.toDateString()}`);

// For a Class 2 Senator specifically (next election 2026)
const senatorReelection = getSenateTimeUntilReelection(2);

// For a House Representative specifically
const houseReelection = getHouseTimeUntilReelection();
*/

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function calculateYearsInOffice(terms) {
  if (!terms || !Array.isArray(terms) || terms.length === 0) {
    return 0;
  }

  const currentYear = getCurrentYear();
  let totalYears = 0;

  for (const term of terms) {
    const startYear = term.startYear;
    const endYear = term.endYear || currentYear; // If no end year, assume current
    totalYears += endYear - startYear;
  }

  return totalYears;
}

export function getTermsBreakdown(terms) {
  if (!terms || !Array.isArray(terms) || terms.length === 0) {
    return {
      totalYears: 0,
      senateYears: 0,
      houseYears: 0,
      senateTerms: 0,
      houseTerms: 0,
    };
  }

  const currentYear = getCurrentYear();
  let senateYears = 0;
  let houseYears = 0;
  let senateTerms = 0;
  let houseTerms = 0;

  for (const term of terms) {
    const startYear = term.startYear;
    const endYear = term.endYear || currentYear; // If no end year, assume current
    const yearsServed = endYear - startYear;
    const chamber = term.chamber;

    if (chamber === "Senate") {
      senateYears += yearsServed;
      senateTerms += Math.ceil(yearsServed / 6);
    } else if (chamber === "House") {
      houseYears += yearsServed;
      houseTerms += Math.ceil(yearsServed / 2);
    }
  }

  return {
    totalYears: senateYears + houseYears,
    senateYears,
    houseYears,
    senateTerms,
    houseTerms,
  };
}
