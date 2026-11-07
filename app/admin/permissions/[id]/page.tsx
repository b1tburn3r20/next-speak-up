import { redirect } from "next/navigation";

/** The user page moved. Old links still arrive. */
export default async function OldUserPage({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/admin/users/${(await params).id}`);
}
