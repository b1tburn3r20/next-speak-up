import type { Metadata } from "next";
import Link from "next/link";
import { OuterBlock, PageHeader } from "@/components/blocks";
import { RoleSelect } from "@/components/admin/role-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePagePermission } from "@/lib/admin/access";
import { listRolesWithPermissions, listUsers } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const session = await requirePagePermission("users.manage");
  const params = await searchParams;
  const roleId = Number(params.role) || undefined;
  const [{ total, page, pages, rows }, { roles }] = await Promise.all([
    listUsers({ q: params.q, roleId, page: Number(params.page) || 1 }),
    listRolesWithPermissions(),
  ]);
  const roleOptions = roles.map((role) => ({ value: String(role.id), label: role.name }));
  const link = (target: number) => {
    const query = new URLSearchParams({
      ...(params.q ? { q: params.q } : {}),
      ...(params.role ? { role: params.role } : {}),
      page: String(target),
    });
    return `/admin/users?${query}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description={`${total.toLocaleString()} ${params.q || roleId ? "matching" : "accounts"}`} />
      <form className="grid grid-cols-2 gap-2 lg:grid-cols-[1fr_auto_auto]" role="search" data-testid="users-search">
        <Input className="col-span-2 lg:col-span-1" name="q" defaultValue={params.q} placeholder="Username, name, or email" aria-label="Search users" />
        <OptionSelect name="role" defaultValue={params.role ?? ""} aria-label="Role" options={[{ value: "", label: "Any role" }, ...roleOptions]} />
        <Button type="submit">Search</Button>
      </form>
      <OuterBlock>
        {rows.length === 0 ? (
          <p className="text-muted-foreground" data-testid="users-empty">Nobody matches that.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]" data-testid="users-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => (
                  <TableRow key={user.id} data-testid="user-row">
                    <TableCell className="max-w-56">
                      <Link href={`/admin/users/${user.id}`} className="break-words font-extrabold text-primary hover:underline">
                        {user.username ?? user.name ?? "No username"}
                      </Link>
                      {user.username && user.name ? <p className="break-words text-xs font-medium text-muted-foreground">{user.name}</p> : null}
                    </TableCell>
                    <TableCell className="max-w-56 break-words">{user.email ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{user._count.billVotes}</TableCell>
                    <TableCell className="whitespace-nowrap">{user.createdAt.toISOString().slice(0, 10)}</TableCell>
                    <TableCell className="min-w-44">
                      <RoleSelect userId={user.id} roleId={user.roleId} options={roleOptions} disabled={user.id === session.user.id} label={`Role for ${user.username ?? user.name ?? "this person"}`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </OuterBlock>
      {pages > 1 ? (
        <nav className="flex items-center justify-between gap-3" aria-label="Pages" data-testid="users-pages">
          {page > 1 ? <Link href={link(page - 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>Newer</Link> : <span />}
          <span className="text-sm font-bold tabular-nums">Page {page} of {pages}</span>
          {page < pages ? <Link href={link(page + 1)} className={buttonVariants({ variant: "secondary", size: "sm" })}>Older</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
