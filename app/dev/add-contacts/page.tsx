// app/dev/add-contacts/page.tsx
import { devService } from "@/lib/services/dev";
import { MemberContactList } from "./components/member-contact-list";
export default async function AddContactsPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const { members, pagination } = await devService.getMembersWithMissingInfo(
    page,
    50
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Add Member Contacts</h1>
      <MemberContactList initialMembers={members} pagination={pagination} />
    </div>
  );
}
