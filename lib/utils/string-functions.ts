import { AgeRange, IncomeRange } from "@prisma/client";
import { format } from "date-fns";

/**
 * Utility functions for converting text between different case formats
 */

/**
 * Converts text to camelCase
 */
export function toCamelCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^([A-Z])/, (m) => m.toLowerCase());
}

/**
 * Converts text to snake_case
 */
export function toSnakeCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

/**
 * Converts text to PascalCase
 */
export function toPascalCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^[a-z]/, (m) => m.toUpperCase());
}

export function formatBillText(rawText: string): string {
  if (!rawText) return "";

  let text = rawText
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove XML-style tags
    .replace(/&lt;[^>]*&gt;/g, "")
    // Fix HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  return text;
}

/**
 * Formats AgeRange enum values into human-readable text
 */
export function formatAgeRange(range: AgeRange | null): string {
  if (!range) return "";

  switch (range) {
    case AgeRange.UNDER_18:
      return "< 18";
    case AgeRange.FROM_18_TO_24:
      return "18-24";
    case AgeRange.FROM_25_TO_34:
      return "25-34";
    case AgeRange.FROM_35_TO_44:
      return "35-44";
    case AgeRange.FROM_45_TO_54:
      return "45-54";
    case AgeRange.FROM_55_TO_64:
      return "55-64";
    case AgeRange.FROM_65_TO_74:
      return "65-74";
    case AgeRange.OVER_75:
      return "75+";
    case AgeRange.PREFER_NOT_TO_SAY:
      return "Prefer not to say";
    default:
      return range;
  }
}

/**
 * Formats IncomeRange enum values into human-readable text with proper money formatting
 */
export function formatIncomeRange(range: IncomeRange | null): string {
  if (!range) return "";

  switch (range) {
    case IncomeRange.UNDER_25000:
      return "< " + toMoneyCase(25000);
    case IncomeRange.FROM_25000_TO_49999:
      return toMoneyCase(25000) + " - " + toMoneyCase(49999);
    case IncomeRange.FROM_50000_TO_74999:
      return toMoneyCase(50000) + " - " + toMoneyCase(74999);
    case IncomeRange.FROM_75000_TO_99999:
      return toMoneyCase(75000) + " - " + toMoneyCase(99999);
    case IncomeRange.FROM_100000_TO_149999:
      return toMoneyCase(100000) + " - " + toMoneyCase(149999);
    case IncomeRange.FROM_150000_TO_199999:
      return toMoneyCase(150000) + " - " + toMoneyCase(199999);
    case IncomeRange.OVER_200000:
      return "> " + toMoneyCase(200000);
    case IncomeRange.PREFER_NOT_TO_SAY:
      return "Prefer not to say";
    default:
      return range;
  }
}

/**
 * Converts text to Capital Case
 */
export function toCapitalCase(text: string): string {
  if (!text) return null;
  return text
    .replace(/[-_\s]+(.)?/g, " $1")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Converts text to lowercase
 */
export function toLowerCase(text: string): string {
  return text.toLowerCase();
}
export const toMoneyCase = (num: number | null): string => {
  if (num === null) return "$0.00";

  // Convert to 2 decimal places and handle rounding
  const formatted = Math.abs(num).toFixed(2);

  // Add commas for thousands
  const parts = formatted.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Combine with dollar sign and handle negative numbers
  return num < 0 ? `-$${parts.join(".")}` : `$${parts.join(".")}`;
};

export function toCalendarCase(dateString: string): string {
  // Split the date string and create date using components to avoid timezone issues
  const [year, month, day] = dateString
    .split("-")
    .map((num) => parseInt(num, 10));
  const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date

  // Get month abbreviation with period
  const monthStr = date.toLocaleString("en", { month: "short" });

  // Get ordinal suffix
  const ordinal = getOrdinalSuffix(day);

  return `${monthStr} ${day}${ordinal}, ${year}`;
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
/**
 * Formats date strings into a standardized format
 */
export function formatDateTime(dateString: string): string {
  try {
    if (
      typeof dateString === "string" &&
      dateString.includes("T") &&
      !isNaN(Date.parse(dateString))
    ) {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy h:mm a");
    }
    return dateString;
  } catch {
    return dateString;
  }
}

/**
 * Formats numbers with comma separators and up to 2 decimal places
 */
export function toNumberCase(num: number | null): string {
  if (num === null) return "0";

  // Convert to string and split into integer and decimal parts
  const [integerPart, decimalPart] = num.toString().split(".");

  // Add commas to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Handle decimal places
  if (decimalPart) {
    const truncatedDecimal = decimalPart.slice(0, 2); // Take up to 2 decimal places
    return `${formattedInteger}.${truncatedDecimal}`;
  }

  return formattedInteger;
}

export function toTimeSinceCase(isoString: string): string {
  const now = new Date();
  const past = new Date(isoString);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return `${diffSecs} ${diffSecs === 1 ? "second" : "seconds"} ago`;
  }
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  }
  if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  }
  return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
}

export function formatIsoDate(
  isoString,
  showTime = true,
  includeYear = true,
  length = "short",
  hideDate = false
) {
  const date = new Date(isoString);
  const month = date.toLocaleString("en", { month: length });
  const day = date.getDate();

  // Function to get proper ordinal suffix
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const hours = date.getHours() % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";

  // Time string
  const timeString = `${hours}:${minutes} ${period}`;

  // If hideDate is true, return only the time
  if (hideDate) {
    return timeString;
  }

  const year = date.getFullYear();
  const dateString = includeYear
    ? `${month} ${day}${getOrdinalSuffix(day)}, ${year}`
    : `${month} ${day}${getOrdinalSuffix(day)}`;

  return showTime ? `${dateString}, ${timeString}` : dateString;
}
