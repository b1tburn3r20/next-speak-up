import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatWhen } from "@/components/admin/run-status";
import { RoleSelect } from "@/components/admin/role-select";
import { Grid, OuterBlock, Section, WithRail } from "@/components/blocks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { requirePagePermission } from "@/lib/admin/access";
import { getUserDetail, listRolesWithPermissions } from "@/lib/admin/queries";
import { rankFor } from "@/lib/civic/ranks";
import { profilePath } from "@/lib/routes";

export const metadata: Metadata = { title: "User" };

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-extrabold text-muted-foreground">{label}</dt>
      <dd className="break-words font-bold">{value}</dd>
    </div>
  );
}

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePagePermission("users.manage");
  const { id } = await params;
  const [detail, { roles }] = await Promise.all([getUserDetail(id), listRolesWithPermissions()]);
  if (!detail) notFound();
  const { user, progress, lastVote, audit } = detail;
  const title = user.username ?? user.name ?? "No username";

  return (
    <div className="space-y-6" data-testid="admin-user">
      <Link href="/admin/users" className="tap text-sm font-bold text-primary hover:underline">
        ← All users
      </Link>
      <WithRail
        lead={
          <OuterBlock className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16 shrink-0">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback className="bg-primary-tint text-xl font-extrabold">{title.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-2xl font-extrabold">{title}</h1>
              <p className="break-words text-sm text-muted-foreground">{user.email ?? "No email"}</p>
              <Link href={profilePath(user.id)} className="text-sm font-bold text-primary hover:underline">
                See their public profile
              </Link>
            </div>
          </OuterBlock>
        }
        rail={
          <OuterBlock className="space-y-3">
            <h2 className="text-lg font-extrabold">Role</h2>
            <RoleSelect
              userId={user.id}
              roleId={user.roleId}
              options={roles.map((role) => ({ value: String(role.id), label: role.name }))}
              disabled={user.id === session.user.id}
              label="Role"
            />
            {user.id === session.user.id ? (
              <p className="text-sm text-muted-foreground">You can&apos;t change your own role. Ask another admin.</p>
            ) : null}
            <div>
              <p className="mb-1 text-xs font-extrabold text-muted-foreground">What it lets them do</p>
              {user.role?.permissions.length ? (
                <ul className="flex flex-wrap gap-1" data-testid="user-permissions">
                  {user.role.permissions.map(({ permission }) => (
                    <li key={permission.name} className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold">
                      {permission.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing beyond a normal account.</p>
              )}
            </div>
          </OuterBlock>
        }
      >
        <Section title="Account">
          <OuterBlock>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Fact label="Joined" value={user.createdAt.toISOString().slice(0, 10)} />
              <Fact label="Last vote" value={lastVote ? formatWhen(lastVote.toISOString()) : "Never"} />
              <Fact label="State" value={user.state ?? "Not set"} />
              <Fact label="Profile" value={user.profile?.isPublic === false ? "Private" : "Public"} />
              <Fact label="Leaderboard" value={user.leaderboardHiddenAt ? "Removed by a moderator" : user.leaderboardOptIn ? "Joined" : "Not joined"} />
            </dl>
          </OuterBlock>
        </Section>
        <Section title="Activity">
          <Grid cols="stats" data-testid="user-activity">
            {[
              ["Rank", rankFor(progress.xp).rank.name],
              ["XP", progress.xp.toLocaleString()],
              ["Votes", String(user._count.billVotes)],
              ["Forum posts", String(user._count.forumPosts)],
              ["Comments", String(user._count.forumComments)],
              ["Reported actions", String(user._count.civicActions)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border-2 border-b-4 bg-card p-3">
                <p className="text-xs font-extrabold text-muted-foreground">{label}</p>
                <p className="break-words text-xl font-extrabold tabular-nums">{value}</p>
              </div>
            ))}
          </Grid>
        </Section>
        {audit.length > 0 ? (
          <Section title="Admin history">
            <OuterBlock>
              <ul className="divide-y text-sm" data-testid="user-audit">
                {audit.map((row) => (
                  <li key={row.id} className="flex flex-wrap justify-between gap-x-3 py-1.5">
                    <span className="min-w-0 break-words">
                      <strong>{row.actorName}</strong> {row.action}
                      {row.detail ? `: ${row.detail}` : ""}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{formatWhen(row.createdAt.toISOString())}</span>
                  </li>
                ))}
              </ul>
            </OuterBlock>
          </Section>
        ) : null}
      </WithRail>
    </div>
  );
}
