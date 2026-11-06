import { STATE_NAMES } from "@/lib/constants/state-names";

export function stateName(code: string): string {
  return (STATE_NAMES as Record<string, string>)[code] ?? code;
}
