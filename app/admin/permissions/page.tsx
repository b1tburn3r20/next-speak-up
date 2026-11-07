import type { Metadata } from "next";
import { PermissionMatrix } from "@/components/admin/permission-matrix";
import { PageHeader } from "@/components/blocks";
import { requirePagePermission } from "@/lib/admin/access";
import { listRolesWithPermissions } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Permissions" };

export default async function AdminPermissionsPage() {
  const session = await requirePagePermission("roles.manage");
  const { roles, permissions } = await listRolesWithPermissions();
  const held = (session.user.permissions ?? []).map((item: { name: string }) => item.name);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles and permissions"
        description="A person has one role, and a role has many permissions. Change takes effect within a minute. You can't change a permission you don't hold."
      />
      <PermissionMatrix roles={roles} permissions={permissions} held={held} />
    </div>
  );
}
