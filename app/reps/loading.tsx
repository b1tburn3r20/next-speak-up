import { Grid, PageShell } from "@/components/blocks";

export default function Loading() {
  return (
    <PageShell aria-busy="true" aria-label="Loading">
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-background-dark" />
      <Grid cols="people">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-80 animate-pulse rounded-2xl border-2 border-b-4 bg-card" />
        ))}
      </Grid>
    </PageShell>
  );
}
