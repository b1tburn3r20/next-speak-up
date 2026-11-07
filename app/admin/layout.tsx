import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdminNav } from "@/components/admin/admin-nav";
import { PageSpacer } from "@/components/blocks";
import { ADMIN_SECTIONS } from "@/lib/admin/access";
import { can } from "@/lib/auth/permissions";

/** Each page also checks its own permission. This shows only the sections someone can open. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const sections = ADMIN_SECTIONS.filter(({ permission }) => can(session, permission));
  if (sections.length === 0) redirect("/");
  return (
    <PageSpacer className="min-w-0 space-y-5">
      <AdminNav sections={sections.map(({ href, label }) => ({ href, label }))} />
      {children}
    </PageSpacer>
  );
}
