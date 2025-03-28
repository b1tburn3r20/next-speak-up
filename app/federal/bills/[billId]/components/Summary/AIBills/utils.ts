import { Term } from "./AiBillKeyTerms";

export const parseKeyTerms = (keyTerms: string): Term[] => {
  const entries = keyTerms.split(/\n\n+/);
  const terms: Term[] = [];

  for (let entry of entries) {
    entry = entry.trim();
    const termMatch = entry.match(/\*\*([^*]+)\*\*/);

    if (termMatch) {
      const term = termMatch[1].trim();
      const rest = entry.substring(termMatch[0].length).trim();
      const definition = rest.replace(/^\*$/, "").trim().slice(5);

      if (term && definition) {
        terms.push({ term, definition });
      }
    }
  }
  return terms;
};
