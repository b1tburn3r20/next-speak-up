import { getAllUsers } from "@/lib/services/user";
import SelectUsers from "./components/SelectUsers"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AuthSession } from "@/lib/types/user-types";
import { getServerSession } from "next-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AllPermissions from "./components/all-permissions";
import { getAllPermissions, getAllRoles } from "@/lib/services/permissions";
import { Label } from "@/components/ui/label";
import AllRoles from "./components/all-roles";
const Page = async () => {
  const session: AuthSession = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId || !["Admin", "Super Admin"].includes(session?.user?.role?.name)) {
    redirect("/")
  }
  const users = await getAllUsers();
  const permissions = await getAllPermissions()
  const roles = await getAllRoles()
  return (
    <div className="min-h-screen flex flex-col gap-4 p-4 container mx-auto">
      <Tabs defaultValue="users">
        <TabsList className="w-full flex">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">Permission</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="flex flex-col gap-4">
          <Label className="text-3xl">All Users</Label>
          <SelectUsers users={users} />
        </TabsContent>
        <TabsContent value="permissions" className="flex flex-col gap-4">
          <Label className="text-3xl">All Permissions</Label>
          <AllPermissions permissions={permissions} />
        </TabsContent>
        <TabsContent value="roles" className="flex flex-col gap-4">
          <Label className="text-3xl">All Roles</Label>
          <AllRoles roles={roles} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export const revalidate = 60;

export default Page;
