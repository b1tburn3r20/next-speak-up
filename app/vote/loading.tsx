import { PageShell } from "@/components/blocks";

export default function Loading() {
  return (
    <PageShell width="narrow" aria-busy="true" aria-label="Loading">
      <div className="space-y-4">
        <div className="h-4 animate-pulse rounded-full bg-background-dark" />
        <div className="h-96 animate-pulse rounded-2xl border-2 border-b-4 bg-card" />
      </div>
    </PageShell>
  );
}
