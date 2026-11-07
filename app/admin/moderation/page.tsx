import type { Metadata } from "next";
import Link from "next/link";
import { AdminActionButton } from "@/components/admin/admin-actions";
import { formatWhen } from "@/components/admin/run-status";
import { OuterBlock, PageHeader, Section } from "@/components/blocks";
import { requirePagePermission } from "@/lib/admin/access";
import { listModeration } from "@/lib/admin/queries";
import { profilePath } from "@/lib/routes";

export const metadata: Metadata = { title: "Moderation" };

export default async function AdminModerationPage() {
  await requirePagePermission("forum.moderate");
  const { hidden, onBoard, abouts } = await listModeration();
  return (
    <div className="space-y-6">
      <PageHeader title="Moderation" description="What people show to each other. Anyone's name and about me can be reviewed here." />
      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="About me text" description="The most recently changed, from public profiles.">
          <OuterBlock data-testid="moderation-abouts">
            {abouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody has written one yet.</p>
            ) : (
              <ul className="divide-y">
                {abouts.map((row) => (
                  <li key={row.user.id} className="space-y-1 py-2.5" data-testid="moderation-about">
                    <p className="whitespace-pre-wrap break-words text-sm">{row.about}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        <Link href={profilePath(row.user.id)} className="font-bold hover:underline">
                          {row.user.username ?? "No username"}
                        </Link>
                        , {formatWhen(row.updatedAt.toISOString())}
                      </p>
                      <AdminActionButton
                        url="/api/user/profile"
                        method="DELETE"
                        body={{ userId: row.user.id }}
                        label="Remove text"
                        ariaLabel={`Remove about me for ${row.user.username ?? "this person"}`}
                        testId="moderation-clear"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </OuterBlock>
        </Section>
        <Section title="Leaderboard" description={`${onBoard.toLocaleString()} people have joined. To remove a name, use the Remove button on the board itself.`}>
          <OuterBlock data-testid="moderation-hidden">
            {hidden.length === 0 ? (
              <p className="text-sm text-muted-foreground">No names have been removed.</p>
            ) : (
              <ul className="divide-y text-sm">
                {hidden.map((user) => (
                  <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 py-2" data-testid="moderation-hidden-row">
                    <span className="min-w-0 break-words">
                      <strong>{user.username ?? "No username"}</strong>, removed {formatWhen(user.leaderboardHiddenAt?.toISOString())}
                    </span>
                    <AdminActionButton
                      url="/api/admin/moderation"
                      method="POST"
                      body={{ action: "restore-leaderboard", userId: user.id }}
                      label="Put back"
                      testId="moderation-restore"
                    />
                  </li>
                ))}
              </ul>
            )}
          </OuterBlock>
        </Section>
      </div>
    </div>
  );
}
