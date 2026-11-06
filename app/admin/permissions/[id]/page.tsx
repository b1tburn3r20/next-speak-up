import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { can } from "@/lib/auth/permissions";
import { getUserById } from "@/lib/services/user";
import UserAccountInformation from "./components/user-account-information";

import CreatePermission from "./components/create-permission";
import ManagePermissions from "./components/manage-permissions";
interface PageProps {
  params: Promise<{
    id: number;
  }>;
}
const Page = async ({ params }: PageProps) => {
  const session = await getServerSession(authOptions);
  if (!can(session, "users.manage")) redirect("/");
  const { id } = await params;
  const userId = id;
  const user = await getUserById(userId);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 min-h-screen">
      <UserAccountInformation user={user} />
      <ManagePermissions />
    </div>
  );
};

export default Page;
