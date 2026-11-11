// Who can see which part of the admin panel. The sections are listed once, so the navigation and
// each page's check can't disagree.
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { can, type PermissionName } from "@/lib/auth/permissions";

export type AdminSection = { href: string; label: string; permission: PermissionName };

export const ADMIN_SECTIONS: AdminSection[] = [
  { href: "/admin", label: "Overview", permission: "admin.view" },
  { href: "/admin/users", label: "Users", permission: "users.manage" },
  { href: "/admin/permissions", label: "Permissions", permission: "roles.manage" },
  { href: "/admin/pipelines", label: "Pipelines", permission: "pipelines.view" },
  { href: "/admin/feedback", label: "Feedback", permission: "feedback.view" },
  { href: "/admin/moderation", label: "Moderation", permission: "forum.moderate" },
  { href: "/admin/glossary", label: "Glossary", permission: "glossary.manage" },
  { href: "/admin/audit", label: "Audit log", permission: "audit.view" },
];

/** For a page: sends away anyone without the permission, and hands back the session otherwise. */
export async function requirePagePermission(permission: PermissionName) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");
  if (!can(session, permission)) redirect(can(session, "admin.view") ? "/admin" : "/");
  return session;
}
