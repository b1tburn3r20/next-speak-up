import { devService } from "@/lib/services/devService";
import { MemberContactList } from "./components/member-contact-list";

export default async function AddContactsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = params?.page ? parseInt(params.page) : 1;
  const { members, pagination } = await devService.getMembersWithMissingInfo(
    page,
    50
  );
  console.log(members)

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Add Member Contacts</h1>
      <MemberContactList initialMembers={members} pagination={pagination} />
    </div>
  );
}
