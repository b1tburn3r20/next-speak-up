// Finding a place by typing part of its name, in the browser, with no request. Pure, so it's tested.

/** Lowercase, without accents, periods, or apostrophes, with "Saint" and "St" the same. */
export function foldName(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\bsaint\b/g, "st")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The places whose names match what was typed, best first: a name that starts with it, then a word that
 * starts with it, then anywhere. Ties keep the order they came in, which is biggest first for cities.
 */
export function matchPlaces<T extends { name: string }>(places: readonly T[], query: string): T[] {
  const typed = foldName(query);
  if (!typed) return [...places];
  const ranked: { place: T; rank: number; index: number }[] = [];
  places.forEach((place, index) => {
    const name = foldName(place.name);
    const rank = name.startsWith(typed) ? 0 : name.split(" ").some((word) => word.startsWith(typed)) ? 1 : name.includes(typed) ? 2 : -1;
    if (rank >= 0) ranked.push({ place, rank, index });
  });
  return ranked.sort((a, b) => a.rank - b.rank || a.index - b.index).map((entry) => entry.place);
}
