// Checks every city in a state for what its page should have, and fails if fewer than 95% have a mayor,
// state legislators, and City Hall. Writes reports/cities-{state}-audit.json, which the browser audit
// (tests/e2e/city-coverage.spec.ts) reads to check that each city's page shows what the data says.
//
//   npm run audit:cities          # Iowa
//   npm run audit:cities -- ia
import { mkdirSync, writeFileSync } from "node:fs";
import { getCityAudits } from "@/lib/civic/city-registry";
import { stateByKey } from "@/lib/civic/states";
import prisma from "@/prisma/client";

async function main() {
  const key = process.argv[2] ?? "ia";
  const state = stateByKey(key);
  if (!state) throw new Error(`No state "${key}" in lib/civic/states.ts`);
  const { cities, gate } = await getCityAudits(state);
  mkdirSync("reports", { recursive: true });
  const path = `reports/cities-${state.key}-audit.json`;
  writeFileSync(path, JSON.stringify({ ranAt: new Date().toISOString(), state: state.key, gate, cities }, null, 2));

  console.log(`${state.name}: ${gate.cities} cities`);
  for (const item of gate.items) {
    const percent = (item.share * 100).toFixed(1).padStart(5);
    console.log(`  ${item.passed ? "ok  " : "FAIL"} ${item.item.padEnd(12)} ${String(item.have).padStart(4)}  ${percent}%${item.required ? "  (needs 95%)" : ""}`);
  }
  const missing = (item: keyof (typeof cities)[number]["audit"]) =>
    cities.filter((city) => !city.audit[item]).slice(0, 10).map((city) => city.name).join(", ");
  for (const item of gate.items.filter((entry) => !entry.passed)) {
    console.log(`  Biggest without ${item.item}: ${missing(item.item)}`);
  }
  console.log(`Report: ${path}`);
  process.exitCode = gate.passed ? 0 : 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 2;
  })
  .finally(() => prisma.$disconnect());
