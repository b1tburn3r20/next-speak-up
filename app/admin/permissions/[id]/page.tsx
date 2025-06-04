import { getUserById } from "@/lib/services/user";
import UserAccountInformation from "./components/UserAccountInformation";

import CreatePermission from "./components/CreatePermission";
import ManagePermissions from "./components/ManagePermissions";
interface PageProps {
  params: Promise<{
    id: number;
  }>;
}
const Page = async ({ params }: PageProps) => {
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
