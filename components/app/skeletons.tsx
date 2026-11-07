// A placeholder for every page, shaped like what's about to appear, so nothing jumps when it arrives.
// docs/loading-states.md lists which one each page and request uses, and a unit test keeps it complete.
import { PageSpacer } from "@/components/blocks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARD = "rounded-2xl border-2 border-b-4 bg-card p-4 sm:p-5";

function Busy({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <PageSpacer width={narrow ? "narrow" : "default"} aria-busy="true" aria-label="Loading" data-testid="page-skeleton">
      {children}
    </PageSpacer>
  );
}

function HeaderSkeleton({ action }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      {action ? <Skeleton className="h-11 w-36" /> : null}
    </div>
  );
}

function CardsSkeleton({ rows = 5, testId }: { rows?: number; testId?: string }) {
  return (
    <div className="space-y-3" data-testid={testId}>
      {Array.from({ length: rows }, (_, index) => (
        <BillCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function BillCardSkeleton() {
  return (
    <div className={cn(CARD, "space-y-2")}>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  );
}

function PeopleSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cn(CARD, "flex items-center gap-3 p-3 sm:p-3")}>
          <Skeleton className="size-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FiltersSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:flex">
      <Skeleton className="col-span-2 h-11 lg:flex-1" />
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className="h-11 lg:w-36" />
      ))}
      <Skeleton className="col-span-2 h-11 lg:col-span-1 lg:w-24" />
    </div>
  );
}

export function TableSkeleton({ rows = 8, columns = 5, testId }: { rows?: number; columns?: number; testId?: string }) {
  return (
    <div className={cn(CARD, "space-y-3")} data-testid={testId}>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex items-center gap-3">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className={cn("h-5", column === 0 ? "w-2/5" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cn(CARD, "space-y-2 p-3 sm:p-3")}>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function RailLayout({ lead, rail, children }: { lead?: React.ReactNode; rail: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="min-w-0 space-y-8">
        {lead}
        {children}
      </div>
      <div className="min-w-0 space-y-4">{rail}</div>
    </div>
  );
}

function BlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-2xl", className)} />;
}

function FloorColumnSkeleton({ label }: { label: string }) {
  return (
    <div className={cn(CARD, "space-y-3")} aria-label={label}>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-5 w-24" />
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  );
}

export function FloorBoardSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2" data-testid="floor-board-skeleton">
      <FloorColumnSkeleton label="House floor" />
      <FloorColumnSkeleton label="Senate floor" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Busy>
      <Skeleton className="h-9 w-72 max-w-full" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => (
          <BlockSkeleton key={index} className="h-24" />
        ))}
      </div>
      <RailLayout rail={[0, 1, 2].map((index) => <BlockSkeleton key={index} className="h-48" />)}>
        <FloorBoardSkeleton />
      </RailLayout>
    </Busy>
  );
}

export function BillListSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton action />
      <BlockSkeleton className="h-16" />
      <FiltersSkeleton />
      <CardsSkeleton />
    </Busy>
  );
}

export function TopicBillsSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton action />
      <CardsSkeleton />
    </Busy>
  );
}

export function TopicsSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      {[0, 1, 2].map((group) => (
        <div key={group} className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <BlockSkeleton key={index} className="h-24" />
            ))}
          </div>
        </div>
      ))}
    </Busy>
  );
}

export function UpcomingSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      <FloorBoardSkeleton />
    </Busy>
  );
}

export function FederalHomeSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3].map((index) => (
          <BlockSkeleton key={index} className="h-32" />
        ))}
      </div>
    </Busy>
  );
}

export function MemberListSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      <FiltersSkeleton count={3} />
      <PeopleSkeleton />
    </Busy>
  );
}

export function BillDetailSkeleton() {
  return (
    <Busy>
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-10 w-4/5" />
        <div className="grid grid-cols-6 gap-1">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-2.5 rounded-full" />
          ))}
        </div>
      </div>
      <RailLayout lead={<BlockSkeleton className="h-64" />} rail={<BlockSkeleton className="h-72" />}>
        <BlockSkeleton className="h-48" />
        <BlockSkeleton className="h-64" />
      </RailLayout>
    </Busy>
  );
}

export function BillTextSkeleton() {
  return (
    <Busy>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-9 w-3/4" />
      <div className={cn(CARD, "space-y-2")}>
        {Array.from({ length: 14 }, (_, index) => (
          <Skeleton key={index} className={cn("h-4", index % 5 === 4 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </Busy>
  );
}

export function RollCallSkeleton() {
  return (
    <Busy>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-9 w-3/4" />
      <FiltersSkeleton count={3} />
      <TableSkeleton rows={12} columns={2} />
    </Busy>
  );
}

export function MemberDetailSkeleton() {
  return (
    <Busy>
      <div className="flex items-center gap-4">
        <Skeleton className="size-24 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-5 w-48 max-w-full" />
        </div>
      </div>
      <TilesSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <BlockSkeleton className="h-56" />
        <BlockSkeleton className="h-56" />
      </div>
    </Busy>
  );
}

export function ProfileSkeleton() {
  return (
    <Busy>
      <div className="overflow-hidden rounded-3xl border-2 border-b-8 bg-card" data-testid="profile-skeleton">
        <Skeleton className="h-32 rounded-none sm:h-52" />
        <div className="space-y-3 px-4 pb-4 sm:px-8">
          <Skeleton className="-mt-14 size-28 rounded-full border-4 border-card sm:-mt-20 sm:size-40" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-3 gap-2 pt-2 sm:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <BlockSkeleton className="h-48" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-64 max-w-full" />
          <BlockSkeleton className="h-32" />
          <BlockSkeleton className="h-32" />
        </div>
      </div>
    </Busy>
  );
}

export function ProgressSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      <RailLayout
        lead={
          <div className="space-y-4">
            <BlockSkeleton className="h-72" />
            <BlockSkeleton className="h-44" />
          </div>
        }
        rail={
          <>
            <BlockSkeleton className="h-64" />
            <BlockSkeleton className="h-16" />
          </>
        }
      >
        <BlockSkeleton className="h-64" />
      </RailLayout>
    </Busy>
  );
}

export function LeaderboardSkeleton() {
  return (
    <Busy narrow>
      <HeaderSkeleton />
      <BlockSkeleton className="h-36" />
      {Array.from({ length: 8 }, (_, index) => (
        <BlockSkeleton key={index} className="h-14" />
      ))}
    </Busy>
  );
}

export function RepsSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <BlockSkeleton key={index} className="h-96" />
        ))}
      </div>
    </Busy>
  );
}

export function VoteSkeleton() {
  return (
    <Busy narrow>
      <Skeleton className="h-4 rounded-full" />
      <BillCardSkeleton />
      <BlockSkeleton className="h-56" />
      <Skeleton className="h-12" />
    </Busy>
  );
}

export function SettingsSkeleton() {
  return (
    <Busy narrow>
      <HeaderSkeleton />
      <BlockSkeleton className="h-48" />
      <BlockSkeleton className="h-32" />
    </Busy>
  );
}

export function FeedbackSkeleton() {
  return (
    <Busy narrow>
      <HeaderSkeleton />
      <BlockSkeleton className="h-72" />
    </Busy>
  );
}

export function ForumListSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton action />
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={cn(CARD, "flex gap-3")}>
          <Skeleton className="h-20 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </Busy>
  );
}

export function ForumPostSkeleton() {
  return (
    <Busy>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-9 w-3/4" />
          <BlockSkeleton className="h-64" />
          <BlockSkeleton className="h-32" />
        </div>
        <BlockSkeleton className="h-64" />
      </div>
    </Busy>
  );
}

export function OnboardingSkeleton() {
  return (
    <Busy narrow>
      <Skeleton className="h-3 rounded-full" />
      <BlockSkeleton className="h-96" />
    </Busy>
  );
}

function AdminHeading() {
  return <HeaderSkeleton />;
}

/** Inside the admin layout, which already has the page wrapper and navigation. */
export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading" data-testid="page-skeleton">
      <AdminHeading />
      <TilesSkeleton count={8} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <BlockSkeleton className="h-52" />
        <BlockSkeleton className="h-52" />
      </div>
    </div>
  );
}

export function AdminTableSkeleton({ filters = false, rows = 10 }: { filters?: boolean; rows?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading" data-testid="page-skeleton">
      <AdminHeading />
      {filters ? <FiltersSkeleton count={1} /> : null}
      <TableSkeleton rows={rows} />
    </div>
  );
}

export function PermissionsSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading" data-testid="page-skeleton">
      <AdminHeading />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
      <TableSkeleton rows={9} columns={6} />
    </div>
  );
}

export function AdminCardsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading" data-testid="page-skeleton">
      <AdminHeading />
      <div className="grid gap-8 lg:grid-cols-2">
        <BlockSkeleton className="h-96" />
        <BlockSkeleton className="h-96" />
      </div>
    </div>
  );
}

export function AdminUserSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading" data-testid="page-skeleton">
      <Skeleton className="h-5 w-24" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-6">
          <BlockSkeleton className="h-28" />
          <BlockSkeleton className="h-40" />
        </div>
        <BlockSkeleton className="h-64" />
      </div>
    </div>
  );
}

/** The pipelines panel, while its first answer is on the way. */
export function PipelinesSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading" data-testid="pipelines-skeleton">
      <TilesSkeleton />
      <BlockSkeleton className="h-36" />
      <TableSkeleton rows={8} columns={6} />
      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}

export function RunDetailSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading" data-testid="run-skeleton">
      <BlockSkeleton className="h-40" />
      <BlockSkeleton className="h-96" />
    </div>
  );
}

// ---- Parts of a page that load after it does ----

/** How your reps voted, while it's on the way after you vote. */
export function RevealSkeleton() {
  return (
    <div className="space-y-3 rounded-xl bg-muted p-3" aria-busy="true" role="status" aria-label="Checking how your reps voted" data-testid="reveal-skeleton">
      <Skeleton className="h-5 w-40 bg-background-dark" />
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full bg-background-dark" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/2 bg-background-dark" />
            <Skeleton className="h-3.5 w-3/4 bg-background-dark" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full bg-background-dark" />
        </div>
      ))}
    </div>
  );
}

/** The policy chart at the end of a voting session. */
export function LeanSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading your topics" data-testid="lean-skeleton">
      <Skeleton className="h-4 w-full" />
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="space-y-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Reps found from a location during onboarding. */
export function RepsRowSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" role="status" aria-label="Finding your reps" data-testid="reps-skeleton">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A dropdown whose options are on the way. */
export function SelectSkeleton({ label }: { label: string }) {
  return <Skeleton className="h-11 w-full" aria-busy="true" role="status" aria-label={label} data-testid="select-skeleton" />;
}

/** The AI's answer on a bill, while it's being written. */
export function AnswerSkeleton() {
  return (
    <div className="space-y-2 rounded-xl bg-muted p-3" aria-busy="true" role="status" aria-label="Writing an answer" data-testid="answer-skeleton">
      <Skeleton className="h-4 w-full bg-background-dark" />
      <Skeleton className="h-4 w-11/12 bg-background-dark" />
      <Skeleton className="h-4 w-2/3 bg-background-dark" />
    </div>
  );
}

/** The bar at the top of the page's first paint. */
export function HudSkeleton() {
  return <Skeleton className="h-6 w-32" aria-hidden />;
}

export function DetailEventSkeleton() {
  return (
    <Busy>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-96 max-w-full" />
      <Skeleton className="h-5 w-56" />
      <RailLayout rail={<BlockSkeleton className="h-56" />}>
        <BlockSkeleton className="h-28" />
        <BlockSkeleton className="h-40" />
      </RailLayout>
    </Busy>
  );
}

export function EventListSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      <FiltersSkeleton />
      <CardsSkeleton />
    </Busy>
  );
}

export function IowaHubSkeleton() {
  return (
    <Busy>
      <HeaderSkeleton />
      <BlockSkeleton className="h-28" />
      <div className="grid gap-4 md:grid-cols-2">
        <BlockSkeleton className="h-64" />
        <BlockSkeleton className="h-64" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <BlockSkeleton key={index} className="h-20" />
        ))}
      </div>
    </Busy>
  );
}
